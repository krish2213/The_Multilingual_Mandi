const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIPriceService {
  constructor() {
    this.productKey = process.env.GEMINI_PRODUCTS_KEY;
    this.priceKey = process.env.GEMINI_PRICES_KEY;
    this.defaultLocation = 'Mumbai';

    if (!this.productKey || !this.priceKey) {
      throw new Error('Missing Gemini API keys');
    }

    this.initModels();
  }

  initModels() {
    const priceAI = new GoogleGenerativeAI(this.priceKey);

    // Base model (schema will be injected per-category)
    this.basePriceAI = priceAI;
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
    const fixedCatalog = {
      vegetables: ['Tomato', 'Onion', 'Potato', 'Carrot', 'Cauliflower'],
      fruits: ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes']
    };

    const items = fixedCatalog[category.toLowerCase()];
    if (!items) throw new Error(`Unsupported category: ${category}`);

    const schema = this.buildBatchSchema(items);

    const batchModel = this.basePriceAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    const prompt = `
Give the current retail market price per kilogram in ${location}, India (early 2026)
for the following items:

${items.join(', ')}

Return ONLY valid JSON matching the schema.
`;

    const result = await batchModel.generateContent(prompt);
    const text = result.response.text().trim();

    console.log('--- RAW BATCH AI RESPONSE ---');
    console.log(text);
    console.log('-----------------------------');

    const data = JSON.parse(text);

    return items.map(name => ({
      id: `${category}-${name.toLowerCase()}`,
      name,
      category,
      marketPrice: Math.round(data[name].price),
      trend: data[name].trend,
      location,
      source: 'Gemini_Batch_AI',
      image: this.getProductImage(name)
    }));
  }

  getProductImage(productName) {
    if (!productName) return `https://via.placeholder.com/300`;
    const formatted = productName.trim().replace(/\b\w/g, c => c.toUpperCase());
    return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(formatted)}.png`;
  }
}

module.exports = AIPriceService;
