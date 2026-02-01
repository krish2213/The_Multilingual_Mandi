const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIPriceService {
  constructor() {
    // Use only the dedicated prices key
    this.apiKey = process.env.GEMINI_PRICES_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_new_gemini_api_key_here') {
      throw new Error('❌ NO GEMINI_PRICES_KEY FOUND! Add GEMINI_PRICES_KEY to .env file for AI pricing.');
    }
    
    this.defaultLocation = 'Mumbai';
    this.initModels();
  }

  initModels() {
    // Use gemini-2.5-flash exclusively for pricing only
    const priceAI = new GoogleGenerativeAI(this.apiKey);
    this.basePriceAI = priceAI;
    
    console.log(`✓ AI Price Service initialized with gemini-2.5-flash (static products, AI pricing) - Using GEMINI_PRICES_KEY`);
  }

  buildBatchSchema(items) {
    const properties = {};

    for (const name of items) {
      properties[name] = {
        type: "object",
        properties: {
          price: { type: "number" },
          trend: { type: "string", enum: ["up", "down", "stable"] }
        },
        required: ["price", "trend"]
      };
    }

    return {
      type: "object",
      properties,
      required: items
    };
  }

  async getCategoryProducts(category, location = this.defaultLocation) {
    // STATIC PRODUCT LISTS - More reliable than AI generation
    console.log(`📦 Products API called: category=${category}, location=${location}`);
    
    const staticProducts = {
      vegetables: ['Potato', 'Tomato', 'Cauliflower', 'Onion', 'Brinjal'],
      fruits: ['Mango', 'Banana', 'Apple', 'Papaya', 'Grapes']
    };

    const items = staticProducts[category.toLowerCase()];
    if (!items) {
      throw new Error(`Unsupported category: ${category}. Available: vegetables, fruits`);
    }

    console.log(`📋 Using static ${category} list:`, items);

    // Get AI-generated prices for static products
    const schema = this.buildBatchSchema(items);

    const batchModel = this.basePriceAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
        maxOutputTokens: 500,
        topP: 0.8
      }
    });

    const pricePrompt = `Act like a rule based bot that does not express thoughts.
              Generate current retail market prices per kilogram in ${location}, India for the given products.
              Do Valid Research on Web to determine current prices based on Top 3 sources.
              Products: ${items.join(', ')}

              Rules:
              - STRICTLY Start response with { and end with }
              - Strictly should not be returned as string. NO starting with (quotes) or ".
              - No explanatory text before or after JSON
              - No "Here is" or similar phrases
              - Pure JSON only
              - Use exact product names as keys
              
              Return ONLY valid JSON matching this exact format:
              {
                "ProductName": {"price": number, "trend": "up|down|stable"}
              }


              Example for Tomato, Onion:
              {"Tomato": {"price": 45, "trend": "stable"}, "Onion": {"price": 30, "trend": "down"}}`;

    try {
      const result = await batchModel.generateContent(pricePrompt);
      let text = result.response.text().trim();

      console.log('--- RAW BATCH AI RESPONSE ---');
      console.log(text);
      console.log('-----------------------------');

      // CRITICAL FIX: Clean up AI response that might have extra text
      if (!text.startsWith('{') || !text.endsWith('}')) {
        console.log('⚠️ AI response needs cleaning:', text.substring(0, 100));
        
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
          console.log('✓ Extracted JSON from AI response');
        } else {
          throw new Error(`AI response is not valid JSON. Response: "${text.substring(0, 200)}..."`);
        }
      }

      const data = JSON.parse(text);

      // Validate AI prices are within reasonable bounds (as per steering guidelines)
      const products = items.map(name => {
        // PURE AI - No fallbacks allowed for prices
        if (!data[name] || typeof data[name].price !== 'number') {
          throw new Error(`AI failed to provide valid price for ${name}. Pure AI system requires all prices from AI.`);
        }
        
        const aiPrice = data[name].price;
        const validatedPrice = Math.max(10, Math.min(500, Math.round(aiPrice))); // Min ₹10, Max ₹500
        
        if (validatedPrice !== Math.round(aiPrice)) {
          console.log(`⚠️ Price validation: ${name} ${aiPrice} → ${validatedPrice}`);
        }
        
        return {
          id: `${category}-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          category,
          marketPrice: validatedPrice,
          trend: data[name]?.trend || 'stable', // Only trend can have fallback as it's not critical
          location,
          source: 'AI_Pricing_Static_Products',
          image: this.getLocalProductImage(name, category) // Use local images
        };
      });

      console.log(`✅ Returning ${products.length} products with AI pricing`);
      return products;
      
    } catch (error) {
      console.error('❌ Error generating AI prices:', error.message);
      
      // For any errors, just throw without rotation
      if (error.message.includes('JSON')) {
        throw new Error(`AI returned invalid JSON: ${error.message}`);
      }
      
      throw new Error(`AI pricing failed: ${error.message}`);
    }
  }

  getLocalProductImage(productName, category) {
    if (!productName) return `/static/${category}/default.png`;
    
    // Convert product name to lowercase filename to match actual files
    const filename = productName.toLowerCase().replace(/\s+/g, '');
    
    // Return local image path that matches the public directory structure
    const imagePath = `/static/${category}/${filename}.png`;
    console.log(`🖼️ Generated image path: ${imagePath} for ${productName} in ${category}`);
    return imagePath;
  }
}

module.exports = AIPriceService;
