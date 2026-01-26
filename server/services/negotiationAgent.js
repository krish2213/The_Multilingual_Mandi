const { GoogleGenerativeAI } = require('@google/generative-ai');

class NegotiationAgent {
  constructor() {
    // Load multiple API keys for rotation
    this.apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(key => key && key !== 'your_new_gemini_api_key_here' && key !== 'your_second_new_gemini_api_key_here' && key !== 'your_third_new_gemini_api_key_here');
    
    this.currentKeyIndex = 0;
    
    if (this.apiKeys.length === 0) {
      throw new Error('❌ NO GEMINI API KEYS FOUND! Add working keys to .env file. Negotiation cannot work without AI.');
    }
    
    this.initializeModel();
    
    // Store floor prices and negotiation states per session
    this.sessionStates = new Map();
  }

  initializeModel() {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    this.genAI = new GoogleGenerativeAI(currentKey);
    // STRICTLY use gemini-2.5-flash model as requested
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 150
      }
    });
    console.log(`✓ Negotiation Agent initialized with gemini-2.5-flash (API key ${this.currentKeyIndex + 1})`);
  }

  rotateAPIKey() {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.log(`🔄 NegotiationAgent: Rotating to API key ${this.currentKeyIndex + 1}`);
      this.initializeModel();
    }
  }

  initializeSession(sessionId, vendorFloorPrices) {
    this.sessionStates.set(sessionId, {
      floorPrices: vendorFloorPrices,
      negotiations: new Map(),
      createdAt: new Date()
    });
    console.log(`✓ Negotiation session initialized for ${sessionId} with floor prices:`, vendorFloorPrices);
  }

  async handleNegotiation(sessionId, productId, customerOffer, marketPrice, round = 1) {
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

    // Decision logic
    if (customerOffer >= floorPrice) {
      negotiationState.status = 'accepted';
      return {
        action: 'accept',
        finalPrice: customerOffer,
        message: 'Offer accepted! Thank you for your business.',
        round
      };
    }

    // Round 1: Polite indirect counter-offer
    if (round === 1) {
      const counterOffer = await this.generatePoliteCounterOffer(
        customerOffer, 
        floorPrice, 
        marketPrice, 
        productId
      );
      
      return {
        action: 'counter',
        counterOffer: counterOffer.price,
        message: counterOffer.message,
        round: round + 1
      };
    }

    // Round 2: Locked final offer (reveal floor price)
    if (round === 2) {
      negotiationState.lockedFinalOffer = true;
      negotiationState.status = 'final_offer';
      
      return {
        action: 'final_offer',
        finalPrice: floorPrice,
        message: `This is my absolute minimum price: ₹${floorPrice}. I cannot go lower than this to maintain quality and cover my costs. Please consider this as my final offer.`,
        round: round + 1,
        isLocked: true
      };
    }

    // Round 3+: Reject if still below floor
    if (round >= 3 && customerOffer < floorPrice) {
      negotiationState.status = 'rejected';
      return {
        action: 'reject',
        message: 'I\'m sorry, but I cannot accept this price as it is below my costs. Thank you for your interest.',
        round
      };
    }

    return {
      action: 'reject',
      message: 'Unable to proceed with this negotiation at the current price.',
      round
    };
  }

  async generatePoliteCounterOffer(customerOffer, floorPrice, marketPrice, productId) {
    const strategicPrice = Math.round(customerOffer + (marketPrice - customerOffer) * 0.6);
    const suggestedPrice = Math.max(strategicPrice, floorPrice);

    const prompt = `You are a polite vegetable vendor in an Indian market (mandi).

SITUATION:
- Product: ${productId}
- Customer offered: ₹${customerOffer}
- Your minimum price: ₹${floorPrice}
- Market price: ₹${marketPrice}

TASK: Generate a polite counter-offer suggesting ₹${suggestedPrice}.

REQUIREMENTS:
- Use warm, respectful language
- Explain value naturally (freshness, quality)
- Maintain good relationship
- Culturally appropriate for Indian markets
- Do NOT reveal your minimum price

Respond in this exact format:
PRICE: ${suggestedPrice}
MESSAGE: [Your polite counter-offer message here]

EXAMPLE:
PRICE: 65
MESSAGE: I understand your budget, but considering the freshness and quality of this produce, could we meet at ₹65? This ensures you get the best product.

Now generate the counter-offer.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      console.log('✓ Counter-offer AI response received');

      // Parse the structured response
      const priceMatch = responseText.match(/PRICE:\s*(\d+)/);
      const messageMatch = responseText.match(/MESSAGE:\s*(.+?)$/s);
      
      const aiPrice = priceMatch ? parseInt(priceMatch[1]) : suggestedPrice;
      const aiMessage = messageMatch ? messageMatch[1].trim() : null;
      
      if (!aiMessage) {
        throw new Error('AI failed to provide proper counter-offer format');
      }
      
      return {
        price: aiPrice,
        message: aiMessage
      };
    } catch (error) {
      console.error('❌ Error generating counter-offer:', error.message);
      
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        this.rotateAPIKey();
        
        try {
          const result = await this.model.generateContent(prompt);
          const response = result.response;
          const responseText = response.text();
          
          const priceMatch = responseText.match(/PRICE:\s*(\d+)/);
          const messageMatch = responseText.match(/MESSAGE:\s*(.+?)$/s);
          
          const aiPrice = priceMatch ? parseInt(priceMatch[1]) : suggestedPrice;
          const aiMessage = messageMatch ? messageMatch[1].trim() : null;
          
          if (!aiMessage) {
            throw new Error('AI retry also failed to provide proper format');
          }
          
          return {
            price: aiPrice,
            message: aiMessage
          };
        } catch (retryError) {
          console.error('❌ Counter-offer retry failed:', retryError.message);
          throw new Error(`AI negotiation failed completely: ${retryError.message}`);
        }
      }
      
      throw new Error(`AI counter-offer generation failed: ${error.message}`);
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