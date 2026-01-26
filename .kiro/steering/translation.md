---
title: Translation and Cultural Adaptation Guidelines
inclusion: always
---

# Translation and Cultural Adaptation Guidelines

## Overview

This steering file provides guidelines for AI-powered multilingual translation and cultural adaptation using Gemini 2.5 Flash model. The system handles English ↔ Hindi ↔ Tamil translations with cultural context for Indian marketplace communication.

## Core Principles

### 1. Cultural Sensitivity
- Maintain respect and politeness in all translations
- Use indirect speech patterns common in Indian business culture
- Preserve dignity of both vendors and customers
- Adapt communication style to marketplace context

### 2. Language Accuracy
- Provide grammatically correct translations
- Use appropriate regional dialects and terminology
- Maintain consistency in vocabulary choices
- Preserve original meaning while adapting culturally

### 3. Marketplace Context
- Use market-appropriate terminology
- Understand bargaining culture and communication patterns
- Adapt formality levels based on vendor-customer dynamics
- Include cultural explanations when necessary

## Supported Languages

### English (Primary)
- **Script**: Latin
- **Region**: Indian English preferred
- **Formality**: Business casual
- **Context**: Primary interface language

### Hindi (हिन्दी)
- **Script**: Devanagari
- **Region**: Standard Hindi with market terminology
- **Formality**: Respectful (आप form preferred)
- **Context**: North Indian markets

### Tamil (தமிழ்)
- **Script**: Tamil script
- **Region**: Standard Tamil with regional market terms
- **Formality**: Respectful forms
- **Context**: South Indian markets

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

## AI Prompt Structure

### Translation Prompt Template
```
You are a linguistic bridge for an Indian marketplace platform. Transform messages between vendor and customer across languages with cultural sensitivity.

INPUT:
- Role: [vendor/customer]
- From Language: [source language]
- To Language: [target language]
- Original Message: "[message text]"

TASK:
1. Translate accurately to [target language]
2. Rewrite in polite, indirect third-person speech
3. Maintain respect and cultural appropriateness for Indian markets

Respond in this exact format:
TRANSLATED: [accurate translation]
INDIRECT: [polite indirect third-person version]
CULTURAL: [brief cultural context]
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

### Market Terminology

**Common Terms:**
- Price → मूल्य (Hindi), விலை (Tamil)
- Quality → गुणवत्ता (Hindi), தரம் (Tamil)
- Fresh → ताज़ा (Hindi), புதிய (Tamil)
- Discount → छूट (Hindi), தள்ளுபடி (Tamil)

**Negotiation Phrases:**
- "Best price" → "सबसे अच्छा दाम" (Hindi), "சிறந்த விலை" (Tamil)
- "Final offer" → "अंतिम प्रस्ताव" (Hindi), "இறுதி விலை" (Tamil)

## Technical Implementation

### Model Configuration
- **Model**: gemini-2.5-flash (exclusively)
- **Temperature**: 0.7 (for natural language flow)
- **Max Tokens**: 200 (for complete translations)
- **Top-P**: 0.95 (for linguistic creativity)

### Response Parsing
- Extract TRANSLATED, INDIRECT, and CULTURAL sections
- Handle various AI response formats gracefully
- Validate translation completeness
- Provide fallback parsing for edge cases

### Error Handling
- No fallback to basic translation services
- Retry with simplified prompts on complex failures
- Rotate API keys on quota limits
- Fail gracefully with clear error messages

## Quality Assurance

### Translation Validation
- Ensure grammatical correctness in target language
- Verify cultural appropriateness of indirect speech
- Check preservation of original meaning
- Validate respectful tone maintenance

### Cultural Accuracy
- Review indirect speech patterns for authenticity
- Ensure marketplace context is maintained
- Verify appropriate formality levels
- Check regional language variations

## Common Scenarios

### Price Negotiations
**Scenario**: Customer asking for lower price
- **Direct Translation**: Literal price reduction request
- **Cultural Adaptation**: Respectful inquiry about price flexibility
- **Indirect Speech**: Third-person mediated communication

### Quantity Discussions
**Scenario**: Customer specifying quantity needs
- **Direct Translation**: Quantity requirement statement
- **Cultural Adaptation**: Polite quantity preference expression
- **Indirect Speech**: Customer interest communication

### Quality Inquiries
**Scenario**: Questions about product freshness/quality
- **Direct Translation**: Quality question
- **Cultural Adaptation**: Respectful quality assurance request
- **Indirect Speech**: Customer concern communication

## Voice Integration

### Speech-to-Text Considerations
- Handle regional accents and pronunciations
- Account for market noise and audio quality
- Provide confidence indicators for transcription
- Support code-switching between languages

### Text-to-Speech Guidelines
- Use appropriate voice characteristics for each language
- Maintain respectful tone in audio output
- Consider regional pronunciation preferences
- Ensure clear articulation of market terms

## Monitoring and Optimization

### Key Metrics
- Translation accuracy rates
- Cultural appropriateness scores
- User satisfaction with indirect speech
- Response time for translation requests

### Continuous Improvement
- Monitor user feedback on translations
- Adjust cultural adaptation based on regional preferences
- Update market terminology regularly
- Refine indirect speech patterns

## Troubleshooting

### Common Issues
1. **Overly formal translations**: Adjust formality based on context
2. **Lost cultural context**: Enhance cultural note generation
3. **Inconsistent indirect speech**: Standardize transformation patterns
4. **Regional dialect mismatches**: Update language models

### Debug Commands
```bash
npm run debug-ai    # Test translation service
npm run test-api    # Test translation endpoints
```

This guidance ensures culturally sensitive, accurate, and contextually appropriate multilingual communication for the Multilingual Mandi platform.