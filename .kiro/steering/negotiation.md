---
title: AI Negotiation Strategies and Guidelines
inclusion: always
---

# AI Negotiation Strategies and Guidelines

## Overview

This steering file provides guidelines for AI-powered negotiation using Gemini 2.5 Flash model exclusively. The system manages multi-round negotiations between vendors and customers with floor price protection, cultural sensitivity, and dedicated API key architecture.

## Core Principles

### 1. Fair Negotiation
- Protect vendor's minimum viable pricing (floor price)
- Respect customer's budget constraints
- Facilitate mutually beneficial agreements
- Maintain transparency in negotiation process
- Maximum 3 rounds per product negotiation

### 2. Cultural Sensitivity
- Use polite, respectful language throughout negotiations
- Employ indirect communication patterns common in Indian markets
- Preserve dignity of both parties during price discussions
- Adapt to regional bargaining customs across 5 supported languages

### 3. Strategic Progression
- Implement structured multi-round negotiation flow
- Escalate appropriately from polite counter-offers to final offers
- Maintain relationship focus over pure profit maximization
- Provide clear exit strategies when agreements aren't possible

## Technical Implementation

### Dedicated API Key Architecture
- **GEMINI_NEGOTIATION_KEY**: Exclusive key for negotiation service
- **Service Isolation**: Separate quota management from other AI services
- **Model Configuration**: gemini-2.5-flash-lite for faster responses
- **Temperature**: 0.8 for natural, varied negotiation responses
- **Max Tokens**: 150 for complete negotiation messages

### Session State Management
```javascript
// Actual implementation from negotiationAgent.js
{
  sessionId: 'ABC123',
  floorPrices: { 'product-id': 40 },
  negotiations: new Map(),
  createdAt: new Date()
}

// Per-product negotiation state
{
  round: 1,
  offers: [
    { round: 1, customerOffer: 30, timestamp: "..." }
  ],
  status: 'active', // active, final_offer, accepted, rejected
  lockedFinalOffer: false
}
```

## Negotiation Flow Structure

### Round 1: AI Counter-Offer (Below Floor Price)
**Trigger**: Customer offer < Floor price
**Strategy**: Generate polite counter-offer using AI
**Tone**: Warm, understanding, value-focused
**Goal**: Find middle ground while highlighting product value

**Implementation Flow:**
```javascript
// Actual logic from negotiationAgent.js
if (customerOffer < floorPrice) {
  // Generate AI counter-offer
  const aiResponse = await this.generateCounterOffer(
    productId, customerOffer, marketPrice, customerLanguage
  );
  return {
    action: 'ai_counter_offer',
    suggestedPrice: aiResponse.price,
    message: aiResponse.message
  };
}
```

### Round 2: Final Offer (Floor Price Revelation)
**Trigger**: Customer rejects Round 1 AI counter-offer
**Strategy**: Reveal floor price as absolute minimum
**Tone**: Firm but respectful, cost-focused
**Goal**: Set clear boundaries while maintaining relationship

### Round 3: Vendor Approval Required (Above Floor Price)
**Trigger**: Customer offer >= floor price after AI counter-offers
**Strategy**: Request vendor approval for above-floor offers
**Goal**: Let vendor make final decision on acceptable offers

### Maximum Rounds: Negotiation Limit
**Trigger**: 3 rounds completed without agreement
**Strategy**: End negotiation politely
**Goal**: Preserve relationship for future transactions

## AI Prompt Structure for Counter-Offers

### Counter-Offer Generation Template
```javascript
// Actual prompt from negotiationAgent.js
const prompt = `You are a polite vegetable vendor in an Indian market.

SITUATION:
- Product: ${productName}
- Customer offered: ₹${customerOffer}
- Market price: ₹${marketPrice}
- Round: ${round}

Generate a polite counter-offer message. Be warm, respectful, and explain value.

Respond in this exact format:
PRICE: [suggested price]
MESSAGE: [Your polite counter-offer message]`;
```

### Multilingual Support
- **Customer Language**: Negotiation responses in customer's preferred language
- **Translation Integration**: Uses GEMINI_TRANSLATION_KEY for language conversion
- **Cultural Adaptation**: Maintains politeness across all 5 supported languages

## Strategic Pricing Logic

### Counter-Offer Calculation
```javascript
// Strategic price positioning (actual implementation)
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

### Multilingual Polite Phrases
**Hindi Context:**
- "मुझे खुशी होगी अगर..." (I would be happy if...)
- "क्या यह संभव है कि..." (Would it be possible that...)
- "गुणवत्ता को देखते हुए..." (Considering the quality...)

**Tamil Context:**
- "தரத்தை கருத்தில் கொண்டு..." (Considering the quality...)
- "சாத்தியமானால்..." (If possible...)
- "நல்ல விலையில்..." (At a good price...)

**Telugu Context:**
- "నాణ్యతను దృష్టిలో ఉంచుకుని..." (Considering the quality...)
- "వీలైతే..." (If possible...)

**Bengali Context:**
- "গুণমান বিবেচনা করে..." (Considering the quality...)
- "সম্ভব হলে..." (If possible...)

### Value Proposition Language
- **Freshness**: "just arrived this morning", "picked yesterday"
- **Quality**: "premium grade", "carefully selected"
- **Scarcity**: "limited quantity", "seasonal availability"
- **Relationship**: "regular customer discount", "special consideration"

## Floor Price Management

### Floor Price Setting Guidelines
- **Vendor Configuration**: Set during inventory management
- **Cost-Plus Model**: Production cost + minimum margin (typically 20-30%)
- **Market-Based**: 70-80% of current market price
- **Quality-Adjusted**: Premium for higher quality products
- **Session-Based Storage**: Floor prices stored per session

### Floor Price Protection Rules
1. **Never reveal floor price in Round 1** - maintain negotiation space
2. **AI counter-offers respect floor** - never suggest below minimum
3. **Vendor approval for above-floor** - let vendor decide on good offers
4. **Explain cost basis** - "to maintain quality and cover costs"

## Negotiation Outcomes

### Successful Agreement
**Conditions**: Customer accepts offer >= floor price
**Response**: Warm acceptance with gratitude
**Follow-up**: Update cart with agreed price

**Example Response:**
```javascript
{
  action: 'price_accepted',
  finalPrice: 42,
  message: 'Wonderful! Thank you for understanding. The price of ₹42 has been accepted.'
}
```

### Vendor Approval Required
**Conditions**: Customer offer >= floor price but needs vendor confirmation
**Response**: Request vendor approval
**Follow-up**: Wait for vendor decision

### Unsuccessful Negotiation
**Conditions**: 3 rounds completed without agreement
**Response**: Polite decline with relationship preservation
**Follow-up**: Leave door open for future transactions

## Socket.IO Integration

### Real-time Negotiation Events
```javascript
// Actual events from server/index.js
socket.on('propose-price', async (data) => {
  const result = await negotiationAgent.handleNegotiation(
    sessionId, productId, customerOffer, marketPrice, round, customerLanguage
  );
  
  socket.emit('negotiation-update', { negotiation, result });
  socket.to(sessionId).emit('negotiation-update', { negotiation, result });
});

socket.on('vendor-approval-response', (data) => {
  // Handle vendor approval/rejection
  socket.to(sessionId).emit('vendor-response-received', data);
});
```

### Event Types
- **propose-price**: Customer initiates price negotiation
- **negotiation-update**: AI response to price proposal
- **vendor-approval-request**: Request vendor approval for above-floor offers
- **vendor-approval-response**: Vendor approves/rejects customer offer
- **price-accepted**: Final price agreement reached

## Quality Assurance

### Message Quality Checks
- **Polite tone verification**: Ensure respectful language
- **Cultural appropriateness**: Validate marketplace context
- **Price logic consistency**: Verify strategic pricing
- **Language accuracy**: Correct grammar and terminology

### Negotiation Flow Validation
- **Round progression**: Confirm proper sequence
- **Floor price protection**: Verify minimum price enforcement
- **Strategic positioning**: Check counter-offer calculations
- **Clear outcomes**: Ensure definitive results

## Common Scenarios and Responses

### Scenario 1: Reasonable Customer Offer (Above Floor)
**Customer**: ₹45 for tomatoes (Floor: ₹40, Market: ₹50)
**Strategy**: Request vendor approval
**Response**: "The customer has offered ₹45. This is above your minimum price. Would you like to accept this offer?"

### Scenario 2: Low Customer Offer (Below Floor)
**Customer**: ₹25 for tomatoes (Floor: ₹40, Market: ₹50)
**Strategy**: AI counter-offer with value explanation
**Response**: AI-generated message emphasizing quality and freshness

### Scenario 3: Persistent Low Offers
**Customer**: Continues offering ₹30 after 2 rounds
**Strategy**: End negotiation politely after 3 rounds
**Response**: "Thank you for your interest. Unfortunately, we cannot meet at this price point."

## Error Handling and Resilience

### AI Service Failures
- **Retry logic**: Alternative prompts on AI failures
- **API key rotation**: Automatic rotation on quota limits
- **Fallback responses**: Generic polite responses for critical failures
- **State preservation**: Maintain negotiation state across retries

### Network and Connection Issues
- **Socket reconnection**: Automatic reconnection handling
- **State synchronization**: Restore negotiation state on reconnection
- **Timeout handling**: Reasonable timeouts for AI responses
- **User feedback**: Clear error messages for users

## Monitoring and Optimization

### Key Metrics
- **Negotiation success rate**: Percentage reaching agreement
- **Average rounds per negotiation**: Efficiency measurement
- **Floor price protection**: Effectiveness of minimum price enforcement
- **Customer satisfaction**: Feedback on negotiation experience
- **AI response quality**: Manual review of generated messages

### Performance Optimization
- **Response time**: Target <3 seconds for AI counter-offers
- **API quota management**: Efficient key rotation and usage monitoring
- **Session cleanup**: Automatic cleanup of expired negotiations
- **Memory management**: Efficient storage of negotiation states

## Integration with Other Services

### Translation Service Integration
- **Message translation**: Counter-offers in customer's language
- **Cultural adaptation**: Polite, indirect speech patterns
- **Consistent terminology**: Market-appropriate vocabulary

### Price Service Integration
- **Market price reference**: Use AI-generated prices as anchors
- **Floor price calculation**: Coordinate with vendor pricing
- **Trend awareness**: Consider price trends in negotiations

## Troubleshooting

### Common Issues
1. **AI generates prices below floor**: 
   - Strengthen floor price validation in prompts
   - Add server-side price validation

2. **Messages too aggressive or rude**:
   - Adjust temperature for more polite responses
   - Enhance cultural context in prompts

3. **Inconsistent negotiation logic**:
   - Validate strategic price calculations
   - Ensure proper round progression

4. **API quota exceeded**:
   - Implement automatic key rotation
   - Monitor usage patterns

### Debug Commands
```bash
npm run debug-ai    # Test negotiation service
npm run test-api    # Test negotiation endpoints
curl http://localhost:5000/api/health  # Check AI service health
```

### Service Health Indicators
- **API key validity**: Verify negotiation key functionality
- **Response time**: Monitor AI service response times
- **Success rate**: Track successful negotiation attempts
- **Error patterns**: Identify common failure modes

This guidance ensures fair, culturally sensitive, and strategically sound AI-powered negotiations for the Multilingual Mandi platform with proper technical implementation and multilingual support.