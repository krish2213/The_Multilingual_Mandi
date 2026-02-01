---
title: AI Pricing Guidelines
inclusion: always
---

# AI Pricing Guidelines for Multilingual Mandi

## Overview

This steering file provides guidelines for AI-powered price generation using Gemini 2.5 Flash model exclusively. The system generates real-time market prices for vegetables and fruits in Indian markets with dedicated API key architecture and static product catalogs.

## Core Principles

### 1. Market Realism
- Prices should reflect actual Indian market conditions
- Consider seasonal variations (February 2026 context)
- Account for regional differences across Indian cities
- Factor in supply-demand dynamics
- Mumbai as default location for price generation

### 2. Price Ranges (₹/kg)
**Vegetables (Static List: Potato, Tomato, Cauliflower, Onion, Brinjal):**
- Budget range: ₹15-40 (potato, onion, cauliflower)
- Mid range: ₹40-80 (tomato, brinjal)
- Premium range: ₹80-150 (exotic vegetables)

**Fruits (Static List: Banana, Apple, Grapes, Mango, Papaya):**
- Budget range: ₹25-60 (banana, papaya)
- Mid range: ₹60-120 (apple, mango)
- Premium range: ₹120-300 (grapes, imported fruits)

### 3. Location Multipliers
- **Tier 1 Cities** (Mumbai, Delhi): 1.15-1.25x base price
- **Tier 2 Cities** (Pune, Chennai): 1.05-1.15x base price
- **Tier 3 Cities** (Smaller towns): 0.85-1.0x base price

### 4. Seasonal Factors (February 2026)
- **Winter vegetables**: Stable prices (cauliflower, onion)
- **Summer fruits**: Moderate prices (mango availability increasing)
- **Year-round items**: Stable pricing (potato, tomato, banana)

## Technical Implementation

### Dedicated API Key Architecture
- **GEMINI_PRICES_KEY**: Exclusive key for price generation service
- **Service Isolation**: Separate quota management from other AI services
- **No Fallbacks**: Pure AI system - fails gracefully if unavailable
- **API Key Rotation**: Multiple keys for quota distribution

### Model Configuration
- **Model**: gemini-2.5-flash (exclusively)
- **Temperature**: 0.3 (for consistent pricing)
- **Max Tokens**: 20 for individual prices, 100 for batch operations
- **Top-P**: 0.8 for balanced creativity
- **Batch Processing**: Efficient pricing for multiple products

### Static Product Implementation
```javascript
// Actual implementation from aiPriceService.js
const staticProducts = {
  vegetables: ['Potato', 'Tomato', 'Cauliflower', 'Onion', 'Brinjal'],
  fruits: ['Banana', 'Apple', 'Grapes', 'Mango', 'Papaya']
};
```

## AI Prompt Guidelines

### Price Generation Prompts
- Always specify location and time context (Mumbai, February 2026)
- Request only numeric responses for consistency
- Include market condition considerations
- Validate price ranges for reasonableness
- Use batch processing for efficiency

### Batch Price Generation Schema
```javascript
// JSON schema for batch price requests
{
  type: "object",
  properties: {
    [productName]: {
      type: "object",
      properties: {
        price: { type: "number" },
        trend: { type: "string", enum: ["up", "down", "stable"] }
      },
      required: ["price", "trend"]
    }
  }
}
```

## Quality Assurance

### Price Validation
- **Minimum price**: ₹10/kg (avoid unrealistic low prices)
- **Maximum price**: ₹500/kg (avoid unrealistic high prices)
- **Consistency check**: Validate prices across similar products
- **Regional variation**: Within reasonable bounds for location
- **Trend validation**: Ensure trend matches price movement

### Error Handling
- **No fallback prices**: AI-only system maintains integrity
- **Retry logic**: Alternative prompts on AI failures
- **API key rotation**: Automatic rotation on quota limits
- **Graceful degradation**: Clear error messages to users
- **Comprehensive logging**: All AI responses logged for debugging

## Cultural Context

### Indian Market Characteristics
- **Bargaining culture**: Prices are starting points for negotiation
- **Quality focus**: Freshness and quality are primary concerns
- **Seasonal awareness**: Availability affects pricing significantly
- **Regional preferences**: Local tastes influence demand and pricing

### Communication Style
- **Clear presentation**: Prices displayed prominently in rupees (₹)
- **Trend indicators**: Visual indicators for price movements
- **Transparency**: AI-generated pricing clearly indicated
- **Market context**: Seasonal and regional factors explained

## Image Integration

### Product Image Mapping
```javascript
// Actual implementation from aiPriceService.js
const imageMapping = {
  'Potato': '/static/vegetables/potato.png',
  'Tomato': '/static/vegetables/tomato.png',
  'Cauliflower': '/static/vegetables/cauliflower.png',
  'Onion': '/static/vegetables/onion.png',
  'Brinjal': '/static/vegetables/brinjal.png',
  'Banana': '/static/fruits/banana.png',
  'Apple': '/static/fruits/apple.png',
  'Grapes': '/static/fruits/grapes.png',
  'Mango': '/static/fruits/mango.png',
  'Papaya': '/static/fruits/papaya.png'
};
```

### Fallback Strategy
- **Default images**: Available for both vegetables and fruits
- **Static serving**: Images served from public/static directory
- **Consistent naming**: Lowercase product names for image paths

## API Integration

### REST Endpoints
- **GET /api/products/:category**: Returns products with AI-generated prices
- **GET /api/health**: AI service health check including pricing service
- **Batch processing**: Single API call generates all prices for category

### Response Format
```javascript
// Actual API response structure
{
  id: 'unique-product-id',
  name: 'Product Name',
  price: 45, // AI-generated price
  trend: 'stable', // AI-generated trend
  image: '/static/category/product.png',
  category: 'vegetables' // or 'fruits'
}
```

## Monitoring and Optimization

### Key Metrics
- **Price generation success rate**: Target >95%
- **AI response time**: Target <5 seconds
- **Price accuracy**: Validation against market reality
- **User acceptance**: Vendor adoption of AI-generated prices
- **API quota usage**: Monitor across all keys

### Performance Optimization
- **Batch processing**: Generate all category prices in single call
- **Caching strategy**: Consider caching for frequently requested prices
- **API key management**: Efficient rotation and quota monitoring
- **Error recovery**: Quick fallback to alternative prompts

## Examples

### Good Price Generation Prompt
```
Generate current retail market prices for these vegetables in Mumbai, India in February 2026: Potato, Tomato, Cauliflower, Onion, Brinjal. 

Respond with JSON containing price (number) and trend (up/down/stable) for each.
```

### Expected AI Response
```json
{
  "Potato": {"price": 25, "trend": "stable"},
  "Tomato": {"price": 45, "trend": "up"},
  "Cauliflower": {"price": 35, "trend": "down"},
  "Onion": {"price": 30, "trend": "stable"},
  "Brinjal": {"price": 50, "trend": "up"}
}
```

## Integration with Other Services

### Negotiation Service Integration
- **Floor price calculation**: AI prices used as market reference
- **Counter-offer generation**: Market prices inform negotiation strategy
- **Price validation**: Ensure negotiated prices are reasonable

### Translation Service Integration
- **Product name translation**: Consistent naming across languages
- **Price communication**: Cultural adaptation of price discussions
- **Market terminology**: Localized pricing vocabulary

## Troubleshooting

### Common Issues
1. **AI returns non-numeric response**: 
   - Strengthen prompt clarity and JSON schema validation
   - Implement response parsing with error handling

2. **Prices outside validation range**:
   - Add explicit range validation in prompts
   - Implement server-side price validation

3. **Inconsistent product naming**:
   - Use static product lists for consistency
   - Implement name normalization

4. **API quota exceeded**:
   - Implement automatic key rotation
   - Monitor usage patterns and optimize batch sizes

### Debug Commands
```bash
npm run debug-ai    # Test AI pricing service initialization
npm run test-api    # Test pricing API endpoints
curl http://localhost:5000/api/health  # Check AI service health
```

### Service Health Indicators
- **API key validity**: Verify all pricing keys are functional
- **Response time**: Monitor AI service response times
- **Success rate**: Track successful price generation attempts
- **Error patterns**: Identify common failure modes

## Future Enhancements

### Potential Improvements
- **Dynamic location**: User-specified location for price generation
- **Historical pricing**: Track price trends over time
- **Seasonal models**: More sophisticated seasonal price adjustments
- **Quality tiers**: Different prices for different quality grades

### Scalability Considerations
- **Caching layer**: Redis for frequently requested prices
- **Database integration**: Store historical pricing data
- **Load balancing**: Distribute AI requests across multiple keys
- **Regional optimization**: Location-specific pricing models

This guidance ensures consistent, culturally appropriate, and market-realistic AI-powered pricing for the Multilingual Mandi platform with proper technical implementation and error handling.