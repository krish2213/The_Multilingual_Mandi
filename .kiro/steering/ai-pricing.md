---
title: AI Pricing Guidelines
inclusion: always
---

# AI Pricing Guidelines for Multilingual Mandi

## Overview

This steering file provides guidelines for AI-powered price generation using Gemini 2.5 Flash model. The system generates real-time market prices for vegetables and fruits in Indian markets.

## Core Principles

### 1. Market Realism
- Prices should reflect actual Indian market conditions
- Consider seasonal variations (January 2026 context)
- Account for regional differences across Indian cities
- Factor in supply-demand dynamics

### 2. Price Ranges (₹/kg)
**Vegetables:**
- Budget range: ₹15-40 (potato, onion, cabbage)
- Mid range: ₹40-80 (tomato, carrot, spinach)
- Premium range: ₹80-150 (bell pepper, exotic vegetables)

**Fruits:**
- Budget range: ₹25-60 (banana, papaya, watermelon)
- Mid range: ₹60-120 (apple, orange, guava)
- Premium range: ₹120-300 (grapes, pomegranate, imported fruits)

### 3. Location Multipliers
- **Tier 1 Cities** (Mumbai, Delhi): 1.15-1.25x base price
- **Tier 2 Cities** (Pune, Chennai): 1.05-1.15x base price
- **Tier 3 Cities** (Smaller towns): 0.85-1.0x base price

### 4. Seasonal Factors (January)
- **Winter vegetables**: Lower prices (cabbage, cauliflower)
- **Summer fruits**: Higher prices (mango, watermelon)
- **Year-round items**: Stable pricing (potato, onion)

## AI Prompt Guidelines

### Price Generation Prompts
- Always specify location and time context
- Request only numeric responses for consistency
- Include market condition considerations
- Validate price ranges for reasonableness

### Product Generation Prompts
- Request exactly 5 products per category
- Focus on common Indian market items
- Avoid exotic or uncommon products
- Ensure cultural appropriateness

## Quality Assurance

### Price Validation
- Minimum price: ₹10/kg (avoid unrealistic low prices)
- Maximum price: ₹500/kg (avoid unrealistic high prices)
- Consistency check across similar products
- Regional variation within reasonable bounds

### Error Handling
- No fallback to hardcoded prices (AI-only system)
- Retry with different API keys on quota limits
- Log all AI responses for debugging
- Fail gracefully with clear error messages

## Cultural Context

### Indian Market Characteristics
- Bargaining is expected and culturally normal
- Quality and freshness are primary concerns
- Seasonal availability affects pricing significantly
- Local preferences vary by region

### Communication Style
- Prices should be presented clearly in rupees
- Include confidence indicators when possible
- Provide trend information (up/down/stable)
- Maintain transparency about AI source

## Technical Implementation

### Model Configuration
- **Model**: gemini-2.5-flash (exclusively)
- **Temperature**: 0.3 (for consistent pricing)
- **Max Tokens**: 20 for prices, 100 for product lists
- **Top-P**: 0.8 for balanced creativity

### API Key Management
- Use multiple keys for quota distribution
- Rotate keys on rate limit errors
- Monitor usage across all keys
- Fail completely if all keys exhausted

## Monitoring and Optimization

### Key Metrics
- Price generation success rate
- Response time for AI calls
- Price accuracy vs market reality
- User acceptance of generated prices

### Continuous Improvement
- Monitor user feedback on pricing
- Adjust prompts based on AI response quality
- Update seasonal factors regularly
- Refine location-based variations

## Examples

### Good Price Generation
```
Prompt: "What is the current retail market price for tomato in Mumbai, India in January 2026?"
Expected Response: "45"
Result: ₹45/kg with high confidence
```

### Good Product Generation
```
Prompt: "List exactly 5 popular vegetables commonly sold in Indian markets."
Expected Response:
Tomato
Onion
Potato
Carrot
Spinach
```

## Troubleshooting

### Common Issues
1. **AI returns non-numeric response**: Improve prompt clarity
2. **Prices too high/low**: Add validation ranges
3. **Inconsistent products**: Specify Indian market context
4. **API quota exceeded**: Implement key rotation

### Debug Commands
```bash
npm run debug-ai    # Test AI service initialization
npm run test-api    # Test all pricing endpoints
```

This guidance ensures consistent, culturally appropriate, and market-realistic AI-powered pricing for the Multilingual Mandi platform.