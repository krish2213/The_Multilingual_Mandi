---
title: AI Negotiation Strategies and Guidelines
inclusion: always
---

# AI Negotiation Strategies and Guidelines

## Overview

This steering file provides guidelines for AI-powered negotiation using Gemini 2.5 Flash model. The system manages multi-round negotiations between vendors and customers with floor price protection and cultural sensitivity.

## Core Principles

### 1. Fair Negotiation
- Protect vendor's minimum viable pricing (floor price)
- Respect customer's budget constraints
- Facilitate mutually beneficial agreements
- Maintain transparency in negotiation process

### 2. Cultural Sensitivity
- Use polite, respectful language throughout negotiations
- Employ indirect communication patterns common in Indian markets
- Preserve dignity of both parties during price discussions
- Adapt to regional bargaining customs

### 3. Strategic Progression
- Implement structured multi-round negotiation flow
- Escalate appropriately from polite counter-offers to final offers
- Maintain relationship focus over pure profit maximization
- Provide clear exit strategies when agreements aren't possible

## Negotiation Flow Structure

### Round 1: Polite Counter-Offer
**Trigger**: Customer offer < Floor price
**Strategy**: Generate polite counter-offer between customer offer and market price
**Tone**: Warm, understanding, value-focused
**Goal**: Find middle ground while highlighting product value

**Example Flow:**
```
Customer Offer: ₹30 for tomatoes
Floor Price: ₹40
Market Price: ₹50
Counter-Offer: ₹42 (strategic positioning)
Message: "I understand your budget, but considering the freshness and quality of these tomatoes, could we meet at ₹42? This ensures you get the best product while covering my costs."
```

### Round 2: Final Offer (Floor Price Revelation)
**Trigger**: Customer rejects Round 1 counter-offer
**Strategy**: Reveal floor price as absolute minimum
**Tone**: Firm but respectful, cost-focused
**Goal**: Set clear boundaries while maintaining relationship

**Example Flow:**
```
Customer Response: Still too high
Floor Price: ₹40
Final Offer: ₹40
Message: "This is my absolute minimum price: ₹40. I cannot go lower than this to maintain quality and cover my costs. Please consider this as my final offer."
```

### Round 3+: Accept or Decline
**Trigger**: Customer response to final offer
**Strategy**: Accept if >= floor price, politely decline if below
**Tone**: Professional, relationship-preserving
**Goal**: Close deal or gracefully exit

## AI Prompt Structure for Counter-Offers

### Counter-Offer Generation Template
```
You are a polite vegetable vendor in an Indian market (mandi).

SITUATION:
- Product: [product name]
- Customer offered: ₹[amount]
- Your minimum price: ₹[floor price]
- Market price: ₹[market price]

TASK: Generate a polite counter-offer suggesting ₹[strategic price].

REQUIREMENTS:
- Use warm, respectful language
- Explain value naturally (freshness, quality)
- Maintain good relationship
- Culturally appropriate for Indian markets
- Do NOT reveal your minimum price

Respond in this exact format:
PRICE: [suggested price]
MESSAGE: [Your polite counter-offer message here]
```

## Strategic Pricing Logic

### Counter-Offer Calculation
```javascript
// Strategic price positioning
const strategicPrice = Math.round(
  customerOffer + (marketPrice - customerOffer) * 0.6
);
const suggestedPrice = Math.max(strategicPrice, floorPrice);
```

### Price Positioning Strategy
- **60% bridge**: Move 60% of the way from customer offer toward market price
- **Floor protection**: Never suggest below floor price
- **Market anchoring**: Use market price as reference point
- **Psychological pricing**: Round to appealing numbers

## Cultural Communication Patterns

### Polite Rejection Phrases
**Hindi Context:**
- "मुझे खुशी होगी अगर..." (I would be happy if...)
- "क्या यह संभव है कि..." (Would it be possible that...)
- "गुणवत्ता को देखते हुए..." (Considering the quality...)

**Tamil Context:**
- "தரத்தை கருத்தில் கொண்டு..." (Considering the quality...)
- "சாத்தியமானால்..." (If possible...)
- "நல்ல விலையில்..." (At a good price...)

### Value Proposition Language
- **Freshness**: "just arrived this morning", "picked yesterday"
- **Quality**: "premium grade", "carefully selected"
- **Scarcity**: "limited quantity", "seasonal availability"
- **Relationship**: "regular customer discount", "special consideration"

## Floor Price Management

### Floor Price Setting Guidelines
- **Cost-Plus Model**: Production cost + minimum margin (typically 20-30%)
- **Market-Based**: 70-80% of current market price
- **Quality-Adjusted**: Premium for higher quality products
- **Seasonal Adjustment**: Account for seasonal cost variations

### Floor Price Protection Rules
1. **Never reveal floor price in Round 1** - maintain negotiation space
2. **Reveal only in Round 2** - as "absolute minimum"
3. **Stick to floor price** - no exceptions to maintain credibility
4. **Explain cost basis** - "to maintain quality and cover costs"

## Negotiation Outcomes

### Successful Agreement
**Conditions**: Customer accepts offer >= floor price
**Response**: Warm acceptance with gratitude
**Follow-up**: Confirm quantity and finalize transaction

**Example:**
```
"Wonderful! Thank you for understanding. I'll prepare [quantity] kg of fresh [product] for you at ₹[agreed price]. You'll be very happy with the quality!"
```

### Unsuccessful Negotiation
**Conditions**: Customer offer remains < floor price after final offer
**Response**: Polite decline with relationship preservation
**Follow-up**: Leave door open for future transactions

**Example:**
```
"I'm sorry, but I cannot accept this price as it is below my costs. Thank you for your interest, and please feel free to check with me again for other products or in the future."
```

## Technical Implementation

### Model Configuration
- **Model**: gemini-2.5-flash (exclusively)
- **Temperature**: 0.8 (for natural, varied responses)
- **Max Tokens**: 150 (for complete negotiation messages)
- **Top-P**: 0.95 (for creative language use)

### Session State Management
```javascript
// Negotiation state tracking
{
  round: 1,
  offers: [
    { round: 1, customerOffer: 30, timestamp: "..." }
  ],
  status: 'active', // active, final_offer, accepted, rejected
  lockedFinalOffer: false
}
```

### Error Handling
- Retry with alternative prompts on AI failures
- Rotate API keys on quota limits
- Maintain negotiation state across retries
- Provide fallback responses for critical failures

## Quality Assurance

### Message Quality Checks
- Verify polite and respectful tone
- Ensure cultural appropriateness
- Check price logic consistency
- Validate message completeness

### Negotiation Flow Validation
- Confirm proper round progression
- Verify floor price protection
- Check strategic price positioning
- Ensure clear outcome communication

## Common Scenarios and Responses

### Scenario 1: Reasonable Customer Offer
**Customer**: ₹45 for tomatoes (Floor: ₹40, Market: ₹50)
**Strategy**: Accept immediately with enthusiasm
**Response**: "Perfect! ₹45 is a fair price for these quality tomatoes."

### Scenario 2: Low Customer Offer
**Customer**: ₹25 for tomatoes (Floor: ₹40, Market: ₹50)
**Strategy**: Counter-offer at ₹40-42 with value explanation
**Response**: Generated via AI with quality/freshness emphasis

### Scenario 3: Persistent Low Offers
**Customer**: Continues offering ₹30 after counter-offers
**Strategy**: Final offer at floor price with cost explanation
**Response**: "This is my absolute minimum: ₹40. I cannot go lower while maintaining quality."

## Monitoring and Optimization

### Key Metrics
- Negotiation success rate (agreements reached)
- Average rounds per negotiation
- Floor price protection effectiveness
- Customer satisfaction with negotiation process

### Continuous Improvement
- Analyze successful negotiation patterns
- Refine counter-offer generation prompts
- Update cultural communication patterns
- Optimize strategic pricing algorithms

## Troubleshooting

### Common Issues
1. **AI generates prices below floor**: Strengthen floor price validation
2. **Messages too aggressive**: Adjust temperature and prompts for politeness
3. **Cultural insensitivity**: Enhance cultural context in prompts
4. **Inconsistent pricing logic**: Validate strategic price calculations

### Debug Commands
```bash
npm run debug-ai    # Test negotiation service
npm run test-api    # Test negotiation endpoints
```

This guidance ensures fair, culturally sensitive, and strategically sound AI-powered negotiations for the Multilingual Mandi platform.