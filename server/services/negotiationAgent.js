const { GoogleGenerativeAI } = require('@google/generative-ai');

class NegotiationAgent {
  constructor() {
    this.negotiationKey = process.env.GEMINI_NEGOTIATION_KEY;
    this.translationKey = process.env.GEMINI_TRANSLATION_KEY;

    this.initializeModel();
    
    // Store floor prices and negotiation states per session
    this.sessionStates = new Map();
  }

  initializeModel() {
    this.genAI = new GoogleGenerativeAI(this.negotiationKey);

    this.negotiationModel = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40
      }
    });
    console.log(`✓ Negotiation Agent initialized (Dedicated NEGOTIATION key)`);
    this.translationAI = new GoogleGenerativeAI(this.translationKey);
    this.translationModel = this.translationAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.2
    }
  });

  console.log('✓ Translation model initialized (TRANSLATION KEY)');

  }



  initializeSession(sessionId, vendorFloorPrices) {
    this.sessionStates.set(sessionId, {
      floorPrices: vendorFloorPrices,
      negotiations: new Map(),
      createdAt: new Date()
    });
    console.log(`✓ Negotiation session initialized for ${sessionId} with floor prices:`, vendorFloorPrices);
  }

  async handleNegotiation(sessionId, productId, customerOffer, marketPrice, round = 1, customerLanguage='en') {
    const sessionState = this.sessionStates.get(sessionId);
    if (!sessionState) {
      throw new Error('Session not initialized - floor prices not set');
    }

    const floorPrice = sessionState.floorPrices[productId];
    if (!floorPrice) {
      console.error(`❌ Floor price not found for product ${productId}. Available:`, sessionState.floorPrices);
      throw new Error(`Floor price not set for product ${productId}`);
    }

    // Get or create negotiation state for this product
    let negotiationState = sessionState.negotiations.get(productId);
    if (!negotiationState) {
      negotiationState = {
        round: 0,
        offers: [],
        status: 'active',
        lockedFinalOffer: false
      };
      sessionState.negotiations.set(productId, negotiationState);
    }

    negotiationState.round = round;
    negotiationState.offers.push({
      round,
      customerOffer,
      timestamp: new Date()
    });

    console.log(`💬 Negotiation for ${productId}: Customer ₹${customerOffer}, Floor ₹${floorPrice}, Round ${round}`);

    // FIRST: Check if offer meets or exceeds floor price - REQUIRE VENDOR APPROVAL
    if (customerOffer >= floorPrice) {
      negotiationState.status = 'pending_vendor_approval';
      return {
        action: 'pending_vendor_approval',
        proposedPrice: customerOffer,
        floorPrice: floorPrice,
        marketPrice: marketPrice,
        message: 'Customer offer is above floor price. Awaiting vendor approval.',
        round,
        requiresVendorApproval: true
      };
    }

    // SECOND: Handle below floor price with AI counter-offers
    if (customerOffer < floorPrice) {
      // Always use AI counter-offers for below floor prices (all rounds)
      try {
        console.log(`🤖 Generating AI counter-offer for ${productId} (Round ${round}) - Below floor price`);
        console.log(`🤖 Parameters: customerOffer=₹${customerOffer}, floorPrice=₹${floorPrice}, marketPrice=₹${marketPrice}`);
        const aiResponse = await this.generatePoliteCounterOffer(customerOffer, floorPrice, marketPrice, productId, round, customerLanguage);
        const translatedMessage = await this.translateMessage(
            aiResponse.message,
            customerLanguage);
        console.log(`🤖 AI Response received:`, aiResponse);
        
        negotiationState.status = round >= 3 ? 'negotiation_limit_exceeded' : 'ai_counter_offer';
        return {
            action: round >= 3 ? 'negotiation_limit_exceeded' : 'ai_counter_offer',
            proposedPrice: customerOffer,
            floorPrice,
            marketPrice,
            message: translatedMessage, 
            round,
            aiGenerated: true,
            allowContinueNegotiation: round < 3,
            isLimitExceeded: round >= 3
          };
      } catch (error) {
        console.error('❌ AI counter-offer failed:', error.message);
        
        // Fallback message for AI failure
        const fallbackMessage = round >= 3 
          ? `Your proposed price of ₹${customerOffer}/kg is too low for this quality product. Your price negotiation limit has been exceeded.`
          : `Your proposed price of ₹${customerOffer}/kg is too low for this quality product. Please consider a more reasonable offer.`;
          
        return {
          action: round >= 3 ? 'negotiation_limit_exceeded' : 'below_floor',
          proposedPrice: customerOffer,
          message: fallbackMessage,
          round,
          allowContinueNegotiation: round < 3,
          isLimitExceeded: round >= 3
        };
      }
    }

    // This shouldn't be reached, but keeping as fallback
    return {
      action: 'pending_vendor',
      message: 'Customer has proposed a new price.',
      round
    };
  }
  async translateMessage(message, targetLanguage) {
            if (!targetLanguage || targetLanguage === 'en') {
              return message;
            }

            const LANGUAGE_MAP = {
              ta: 'Tamil',
              hi: 'Hindi',
              te: 'Telugu',
              kn: 'Kannada',
              ml: 'Malayalam'
            };

            const languageName = LANGUAGE_MAP[targetLanguage];
            if (!languageName) return message;

            const prompt = `
          You are a native ${languageName} speaker.
          Translate the following message into ${languageName}.
          Keep it polite and natural.
          Do NOT explain.
          Do NOT add extra text or your thoughts.
          ACT LIKE A SIMPLE TRANSLATOR THAT SPITS ONLY TRANSLATED TEXT.
          TEXT:
          "${message}"
          `;

            try {
              const result = await this.translationModel.generateContent(prompt);
              return result.response.text().trim();
            } catch (err) {
              console.error('❌ Translation failed:', err.message);
              return message; // fallback to English
            }
          }


  async generatePoliteCounterOffer(customerOffer, floorPrice, marketPrice, productId, round,customerLanguage) {
    const avg = Math.round((floorPrice + marketPrice) / 2);
    const rangeMin = avg - 1;
    const rangeMax = avg + 1;

    
    // If round 3 and still below floor, add limit exceeded message
    const limitExceededMessage = round >= 3 ? " Your price negotiation limit has been exceeded." : "";
    const prompt = `
                      SITUATION:
                      - Product: ${productId}
                      - Customer offered: ₹${customerOffer}
                      - Market price: ₹${marketPrice}
                      - Round: ${round}

                      TASK: Generate a polite counter-offer suggesting a price range 
                    from ₹${rangeMin} to ₹${rangeMax}.

                      REQUIREMENTS:
                      - Use warm, respectful language
                      - Suggest this specific price RANGE (₹${rangeMin} to ₹${rangeMax})
                      - Explain value naturally (freshness, quality) of the product
                      - Focus on quality and market value
                      
                        Now generate the counter-offer. Without adding your response thoughts. 
                        JUST STRAIGHT 3 LINE (STRICTLY LESS THAN 30 WORDS - STRAIGHT TO POINT) DRAFT ABOUT 
                        Value, Range Nudging, and ${limitExceededMessage}

                        VERY STRICTLY FOLLOW THIS: format (response.match(/MESSAGE:\s*(.+)/s);)
                        MESSAGE: [Your polite counter-offer message with price range ₹${rangeMin} to ₹${rangeMax}] ${limitExceededMessage}`;

                      
                        

    try {
      const result = await this.negotiationModel.generateContent(prompt);
      const response = result.response.text().trim();
      
      // Parse the response
      const messageMatch = response.match(/MESSAGE:\s*(.+)/s);
      
      const fallbackMessage = `The price is too low. Propose a better price.${limitExceededMessage}`;
      
      if (messageMatch) {
        return {
          message: messageMatch[1].trim()
        };
      }  else {
        // AI response format completely unexpected - use fallback price and message
        console.warn('⚠️ AI response format completely unexpected:', response);
        return {
          message: fallbackMessage
        };
      }
    } catch (error) {
      console.error('❌ Counter-offer generation failed:', error.message);
      
      return {
        message: fallbackMessage
      };
    }
  }

  handleVendorResponse(sessionId, productId, response, customMessage = null) {
    const sessionState = this.sessionStates.get(sessionId);
    if (!sessionState) {
      throw new Error('Session not initialized');
    }

    const negotiationState = sessionState.negotiations.get(productId);
    if (!negotiationState) {
      throw new Error('No active negotiation found for this product');
    }

    const lastOffer = negotiationState.offers[negotiationState.offers.length - 1];
    if (!lastOffer) {
      throw new Error('No customer offer found');
    }

    console.log(`🏪 Vendor response for ${productId}: ${response}`);

    switch (response) {
      case 'accept':
        negotiationState.status = 'accepted';
        return {
          action: 'accepted',
          finalPrice: lastOffer.customerOffer,
          message: 'Vendor has accepted your offer! Thank you for your business.',
          agreedPrice: lastOffer.customerOffer
        };

      case 'reject':
        negotiationState.status = 'rejected';
        return {
          action: 'rejected',
          message: 'Vendor has rejected your offer. You can try proposing a different price or send a message to discuss.',
          proposedPrice: lastOffer.customerOffer
        };

      case 'custom_message':
        negotiationState.status = 'custom_message';
        return {
          action: 'custom_message',
          message: customMessage || 'Vendor has sent you a message.',
          proposedPrice: lastOffer.customerOffer
        };

      default:
        throw new Error(`Invalid vendor response: ${response}`);
    }
  }

  getNegotiationState(sessionId, productId) {
    const sessionState = this.sessionStates.get(sessionId);
    if (!sessionState) return null;
    
    return sessionState.negotiations.get(productId);
  }

  updateFloorPrice(sessionId, productId, newFloorPrice) {
    const sessionState = this.sessionStates.get(sessionId);
    if (sessionState) {
      sessionState.floorPrices[productId] = newFloorPrice;
      console.log(`✓ Updated floor price for ${productId} in session ${sessionId}: ₹${newFloorPrice}`);
    }
  }

  getFloorPrices(sessionId) {
    const sessionState = this.sessionStates.get(sessionId);
    return sessionState ? sessionState.floorPrices : null;
  }

  clearSession(sessionId) {
    this.sessionStates.delete(sessionId);
    console.log(`✓ Cleared negotiation session: ${sessionId}`);
  }

  getSessionNegotiations(sessionId) {
    const sessionState = this.sessionStates.get(sessionId);
    if (!sessionState) return {};
    
    const negotiations = {};
    for (const [productId, state] of sessionState.negotiations.entries()) {
      negotiations[productId] = {
        ...state,
        floorPrice: sessionState.floorPrices[productId]
      };
    }
    
    return negotiations;
  }
}

module.exports = NegotiationAgent;