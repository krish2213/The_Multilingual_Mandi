---
title: Translation and Cultural Adaptation Guidelines
inclusion: always
---

# Translation and Cultural Adaptation Guidelines

## Overview

This steering file provides guidelines for AI-powered multilingual translation and cultural adaptation using Gemini 2.5 Flash model exclusively. The system handles 5-language translation (English ↔ Hindi ↔ Tamil ↔ Telugu ↔ Bengali) with cultural context for Indian marketplace communication.

## Core Principles

### 1. Cultural Sensitivity
- Maintain respect and politeness in all translations
- Use indirect speech patterns common in Indian business culture
- Preserve dignity of both vendors and customers
- Adapt communication style to marketplace context across all 5 languages

### 2. Language Accuracy
- Provide grammatically correct translations
- Use appropriate regional dialects and terminology
- Maintain consistency in vocabulary choices (1313+ translation keys)
- Preserve original meaning while adapting culturally

### 3. Marketplace Context
- Use market-appropriate terminology
- Understand bargaining culture and communication patterns
- Adapt formality levels based on vendor-customer dynamics
- Include cultural explanations when necessary

## Technical Implementation

### Dedicated API Key Architecture
- **GEMINI_TRANSLATE_KEY**: Exclusive key for translation service
- **GEMINI_POLITE_KEY**: Dedicated key for polite conversion service
- **Service Isolation**: Separate quota management from other AI services
- **Dual Model System**: Translation + Polite conversion for cultural adaptation

### Model Configuration
```javascript
// Actual implementation from messageTransformService.js
this.translationModel = translateGenAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1000,
    topK: 40
  }
});

this.politeModel = politeGenAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.8,
    topP: 0.95,
    maxOutputTokens: 1000,
    topK: 40
  }
});
```

## Supported Languages (5 Total)

### English (Primary)
- **Script**: Latin
- **Region**: Indian English preferred
- **Formality**: Business casual
- **Context**: Primary interface language
- **Voice**: UK English Male (ResponsiveVoice)

### Hindi (हिन्दी)
- **Script**: Devanagari
- **Region**: Standard Hindi with market terminology
- **Formality**: Respectful (आप form preferred)
- **Context**: North Indian markets
- **Voice**: Hindi Male (ResponsiveVoice)

### Tamil (தமிழ்)
- **Script**: Tamil script
- **Region**: Standard Tamil with regional market terms
- **Formality**: Respectful forms
- **Context**: South Indian markets
- **Voice**: Tamil Male (ResponsiveVoice)

### Telugu (తెలుగు)
- **Script**: Telugu script
- **Region**: Standard Telugu with market terminology
- **Formality**: Respectful forms
- **Context**: Andhra Pradesh and Telangana markets
- **Voice**: Telugu Male (ResponsiveVoice)

### Bengali (বাংলা)
- **Script**: Bengali script
- **Region**: Standard Bengali with market terms
- **Formality**: Respectful forms
- **Context**: West Bengal and Bangladesh markets
- **Voice**: Bengali Male (ResponsiveVoice)

## Comprehensive Localization (1313+ Translation Keys)

### UI Component Categories
```javascript
// Actual categories from i18n/index.js
- Common terms (welcome, continue, back, next, cancel, confirm)
- Roles (vendor, customer, selectRole)
- Categories (vegetables, fruits, fish, flowers)
- Session management (sessionId, enterSessionId, sessionCreated)
- Inventory (marketPrice, yourPrice, floorPrice, availableQuantity)
- Negotiation (proposePrice, counterOffer, acceptOffer, rejectOffer)
- Payment (paymentMethod, upiPayment, cashPayment, paymentSuccess)
- Voice integration (startListening, stopListening, speakText)
- Product names (potato, tomato, cauliflower, onion, brinjal, banana, apple, grapes, mango, papaya)
- Quality terms (fresh, premium, organic, seasonal)
- Quantity terms (kilogram, piece, dozen, bundle)
- Error messages (sessionNotFound, paymentFailed, networkError)
```

### Product Name Translation
```javascript
// Actual implementation from components
const translateProductName = (productName) => {
  const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
  const translationKey = normalizedName;
  const translated = t(translationKey);
  return translated === translationKey ? productName : translated;
};
```

## Translation Patterns

### Direct to Indirect Speech Transformation

**English Vendor → Hindi Customer:**
```
Direct: "I cannot go below 40 rupees"
Translated: "मैं 40 रुपये से नीचे नहीं जा सकता"
Indirect: "विक्रेता ने बताया कि वर्तमान बाजार दर 40 रुपये से कम मूल्य की अनुमति नहीं देती"
Cultural Note: "Maintains vendor dignity while explaining constraint"
```

**Hindi Customer → English Vendor:**
```
Direct: "थोड़ा कम करो"
Translated: "Please reduce a bit"
Indirect: "The customer is respectfully inquiring if a slightly lower price might be possible"
Cultural Note: "Polite negotiation preserves relationship"
```

**Tamil Customer → English Vendor:**
```
Direct: "5 கிலோ வேண்டும்"
Translated: "I need 5 kg"
Indirect: "The customer would like to purchase 5 kilograms"
Cultural Note: "Direct confirmation maintains clarity"
```

**Telugu Customer → English Vendor:**
```
Direct: "ధర తగ్గించండి"
Translated: "Please reduce the price"
Indirect: "The customer is respectfully asking if a price reduction might be possible"
Cultural Note: "Polite request maintains respect"
```

**Bengali Customer → English Vendor:**
```
Direct: "দাম কমান"
Translated: "Reduce the price"
Indirect: "The customer is politely inquiring about the possibility of a lower price"
Cultural Note: "Respectful negotiation approach"
```

## AI Prompt Structure

### Translation Prompt Template
```javascript
// Actual implementation from messageTransformService.js
const prompt = `You are a linguistic bridge for an Indian marketplace platform. Transform messages between vendor and customer across languages with cultural sensitivity.

INPUT:
- Role: ${senderRole}
- From Language: ${senderLanguage}
- To Language: ${recipientLanguage}
- Original Message: "${text}"

TASK:
1. Translate accurately to ${recipientLanguage}
2. Rewrite in polite, indirect third-person speech
3. Maintain respect and cultural appropriateness for Indian markets

Respond in this exact format:
TRANSLATED: [accurate translation]
INDIRECT: [polite indirect third-person version]
CULTURAL: [brief cultural context]`;
```

### Response Parsing
```javascript
// Actual parsing logic from messageTransformService.js
const parseAIResponse = (response) => {
  const lines = response.split('\n');
  let translated = '', indirect = '', cultural = '';
  
  for (const line of lines) {
    if (line.startsWith('TRANSLATED:')) {
      translated = line.substring(11).trim();
    } else if (line.startsWith('INDIRECT:')) {
      indirect = line.substring(9).trim();
    } else if (line.startsWith('CULTURAL:')) {
      cultural = line.substring(9).trim();
    }
  }
  
  return { translated, indirect, cultural };
};
```

## Cultural Adaptation Rules

### Politeness Levels
1. **High Formality**: First interactions, price negotiations
2. **Medium Formality**: Regular transactions, quantity discussions
3. **Low Formality**: Friendly repeat customers (still respectful)

### Indirect Speech Patterns
- **Vendor Statements**: "The vendor mentions/explains/suggests..."
- **Customer Requests**: "The customer is inquiring/would like/is interested in..."
- **Negotiations**: "...is respectfully asking if..." / "...wonders if it might be possible..."

### Market Terminology (All 5 Languages)

**Common Terms:**
- Price → मूल्य (Hindi), விலை (Tamil), ధర (Telugu), দাম (Bengali)
- Quality → गुणवत्ता (Hindi), தரம் (Tamil), నాణ్యత (Telugu), গুণমান (Bengali)
- Fresh → ताज़ा (Hindi), புதிய (Tamil), తాజా (Telugu), তাজা (Bengali)
- Discount → छूट (Hindi), தள்ளுபடி (Tamil), తగ్గింపు (Telugu), ছাড় (Bengali)

**Negotiation Phrases:**
- "Best price" → "सबसे अच्छा दाम" (Hindi), "சிறந்த விலை" (Tamil), "మంచి ధర" (Telugu), "ভাল দাম" (Bengali)
- "Final offer" → "अंतिम प्रस्ताव" (Hindi), "இறுதி விலை" (Tamil), "చివరి ఆఫర్" (Telugu), "চূড়ান্ত অফার" (Bengali)

## Voice Integration

### Speech Recognition (Web Speech API)
```javascript
// Actual implementation from speechUtils.js
const languageMap = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'bn': 'bn-IN'
};

this.recognition.lang = languageMap[language] || 'en-US';
```

### Text-to-Speech (ResponsiveVoice)
```javascript
// Actual voice mapping from speechUtils.js
this.voiceMap = {
  'en': 'UK English Male',
  'hi': 'Hindi Male',
  'ta': 'Tamil Male',
  'te': 'Telugu Male',
  'bn': 'Bengali Male'
};
```

### Voice Features
- **Male Voice Preference**: Consistent male voices across all languages
- **Language-Specific Voices**: Dedicated voice for each supported language
- **Quality TTS**: ResponsiveVoice instead of browser TTS for better multilingual support
- **Voice Controls**: Start/stop speaking functionality with language detection

## Socket.IO Integration

### Real-time Translation Events
```javascript
// Actual events from server/index.js
socket.on('send-custom-message', async (data) => {
  try {
    const transformedMessage = await messageTransformService.transformMessage(
      data.message, data.senderRole, data.senderLanguage, data.recipientLanguage
    );
    
    socket.emit('message-sent', { success: true });
    socket.to(sessionId).emit('custom-message-received', {
      message: transformedMessage.indirect,
      senderRole: data.senderRole,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    socket.emit('message-error', { error: error.message });
  }
});
```

## Error Handling and Resilience

### Translation Service Failures
- **No fallback services**: Pure AI system maintains consistency
- **Retry logic**: Alternative prompts on AI failures
- **API key rotation**: Automatic rotation on quota limits
- **Graceful degradation**: Clear error messages in user's language

### Response Validation
```javascript
// Actual validation from messageTransformService.js
if (!translated || !indirect) {
  throw new Error('Incomplete AI response - missing translation or indirect speech');
}

if (translated.length < 2 || indirect.length < 2) {
  throw new Error('AI response too short - likely incomplete');
}
```

## Quality Assurance

### Translation Validation
- **Grammatical correctness**: Validate syntax in target language
- **Cultural appropriateness**: Ensure marketplace context is maintained
- **Meaning preservation**: Verify original intent is preserved
- **Respectful tone**: Maintain politeness across all languages

### Cultural Accuracy
- **Indirect speech patterns**: Verify authentic third-person communication
- **Marketplace context**: Ensure appropriate business terminology
- **Formality levels**: Check appropriate respect levels
- **Regional variations**: Validate language-specific cultural norms

## Common Scenarios

### Price Negotiations
**Scenario**: Customer asking for lower price in Hindi
- **Direct Translation**: Literal price reduction request
- **Cultural Adaptation**: Respectful inquiry about price flexibility
- **Indirect Speech**: "The customer is respectfully inquiring if a slightly lower price might be possible"

### Quantity Discussions
**Scenario**: Customer specifying quantity needs in Tamil
- **Direct Translation**: Quantity requirement statement
- **Cultural Adaptation**: Polite quantity preference expression
- **Indirect Speech**: "The customer would like to purchase [quantity] of [product]"

### Quality Inquiries
**Scenario**: Questions about product freshness in Telugu
- **Direct Translation**: Quality question
- **Cultural Adaptation**: Respectful quality assurance request
- **Indirect Speech**: "The customer is inquiring about the freshness and quality of the products"

## API Integration

### REST Endpoints
```javascript
// Actual endpoint from server/index.js
app.post('/api/transform-message', async (req, res) => {
  try {
    const { text, senderRole, senderLanguage, recipientLanguage } = req.body;
    
    const result = await messageTransformService.transformMessage(
      text, senderRole, senderLanguage, recipientLanguage
    );
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Supported Languages Endpoint
```javascript
app.get('/api/languages', (req, res) => {
  res.json({
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
    ]
  });
});
```

## Monitoring and Optimization

### Key Metrics
- **Translation accuracy rates**: Manual review of translations
- **Cultural appropriateness scores**: User feedback on cultural adaptation
- **Response time**: Target <3 seconds for message transformation
- **User satisfaction**: Feedback on indirect speech quality
- **Language usage distribution**: Track which languages are most used

### Performance Optimization
- **Caching**: Consider caching common phrases and translations
- **Batch processing**: Group multiple messages for efficiency
- **API quota management**: Monitor usage across dedicated keys
- **Response time optimization**: Optimize prompt length and complexity

## Integration with Other Services

### Negotiation Service Integration
- **Multilingual negotiations**: Counter-offers in customer's language
- **Cultural adaptation**: Polite negotiation patterns across languages
- **Consistent terminology**: Unified pricing vocabulary

### Voice Service Integration
- **Speech recognition**: Multi-language voice input
- **Text-to-speech**: Multi-language voice output
- **Language detection**: Automatic language identification

## Troubleshooting

### Common Issues
1. **Overly formal translations**: 
   - Adjust formality based on context and relationship
   - Fine-tune temperature settings for more natural language

2. **Lost cultural context**: 
   - Enhance cultural note generation in prompts
   - Provide more marketplace context in AI instructions

3. **Inconsistent indirect speech**: 
   - Standardize transformation patterns across languages
   - Validate third-person speech patterns

4. **Regional dialect mismatches**: 
   - Update language models with regional variations
   - Incorporate local market terminology

### Debug Commands
```bash
npm run debug-ai    # Test translation service
npm run test-api    # Test translation endpoints
curl http://localhost:5000/api/languages  # Check supported languages
```

### Service Health Indicators
- **API key validity**: Verify both translation and polite conversion keys
- **Response time**: Monitor AI service response times
- **Success rate**: Track successful translation attempts
- **Error patterns**: Identify common failure modes

This guidance ensures culturally sensitive, accurate, and contextually appropriate multilingual communication for the Multilingual Mandi platform with comprehensive 5-language support and proper technical implementation.