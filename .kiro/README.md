# .kiro Directory - Multilingual Mandi Configuration

This directory contains Kiro-specific configuration and steering files for the Multilingual Mandi project, a sophisticated AI-powered marketplace platform with 5-language support and real-time negotiation capabilities.

## 📁 Directory Structure

```
.kiro/
├── README.md           # This file - project configuration overview
├── steering/           # AI guidance and best practices
│   ├── ai-pricing.md   # AI pricing engine guidelines (Gemini 2.5 Flash)
│   ├── translation.md  # Multilingual translation best practices (5 languages)
│   └── negotiation.md  # Smart negotiation strategies and cultural patterns
└── settings/           # Kiro project configuration
    └── project.json    # Comprehensive project metadata and settings
```

## 🎯 Project Overview

**Multilingual Mandi** is a production-ready, AI-powered marketplace platform that enables seamless communication between vendors and customers across 5 languages (English, Hindi, Tamil, Telugu, Bengali) with intelligent pricing, negotiation, and real-time synchronization.

### Key Statistics
- **Languages Supported**: 5 (English, Hindi, Tamil, Telugu, Bengali)
- **Translation Keys**: 1313+ comprehensive localization
- **AI Services**: 4 dedicated services with separate API keys
- **Socket Events**: 25+ real-time event types
- **Components**: 50+ frontend and backend components
- **Status**: Production-ready with comprehensive feature set

## 🤖 AI Integration Architecture

### Dedicated AI Services (Gemini 2.5 Flash Exclusive)
1. **Price Generation** (`GEMINI_PRICES_KEY`)
   - Real-time market price analysis
   - Seasonal and regional variations
   - No fallback prices - pure AI system

2. **Translation** (`GEMINI_TRANSLATE_KEY`)
   - Multilingual message translation
   - Cultural context preservation
   - 5-language support

3. **Polite Conversion** (`GEMINI_POLITE_KEY`)
   - Indirect speech transformation
   - Cultural adaptation for Indian markets
   - Respectful communication patterns

4. **Negotiation Agent** (`GEMINI_NEGOTIATION_KEY`)
   - Multi-round negotiation logic
   - AI-generated counter-offers
   - Floor price protection

## 📋 Steering Files

### ai-pricing.md
Comprehensive guidelines for AI-powered price generation including:
- **Market Realism**: Actual Indian market conditions and seasonal factors
- **Price Ranges**: ₹10-500/kg validation with category-specific ranges
- **Location Multipliers**: Tier 1/2/3 city adjustments
- **Quality Assurance**: Price validation and error handling
- **Technical Implementation**: Model configuration and API key management

### translation.md
Best practices for multilingual translation and cultural adaptation:
- **Cultural Sensitivity**: Respectful and polite communication patterns
- **Language Accuracy**: Grammatically correct translations with regional dialects
- **Marketplace Context**: Market-appropriate terminology and bargaining culture
- **Indirect Speech Transformation**: Converting direct statements to polite third-person
- **Voice Integration**: Speech-to-text and text-to-speech guidelines

### negotiation.md
Strategic negotiation patterns and cultural guidelines:
- **Fair Negotiation**: Floor price protection with customer budget respect
- **Cultural Sensitivity**: Indian marketplace communication patterns
- **Strategic Progression**: Multi-round negotiation flow (max 3 rounds)
- **AI Prompt Structure**: Counter-offer generation templates
- **Quality Assurance**: Message quality checks and flow validation

## ⚙️ Settings Configuration

### project.json
Comprehensive project metadata including:
- **Technology Stack**: Complete frontend/backend dependency information
- **Core Features**: Implementation status of all major features
- **AI Integration**: Detailed AI service configurations and API key mappings
- **Architecture**: Scalability and deployment considerations
- **Quality Metrics**: Performance targets and security features
- **Documentation**: File references and line count statistics

## 🔧 Usage Guidelines

### For AI Agents
These files are automatically loaded by Kiro when working on the project, providing:
- **Context-Aware Assistance**: Understanding of project architecture and goals
- **Cultural Sensitivity**: Guidelines for Indian marketplace communication
- **Technical Accuracy**: Proper AI service usage and configuration
- **Quality Standards**: Consistent code generation and modification practices

### For Developers
- **Project Understanding**: Comprehensive overview of implemented features
- **AI Service Integration**: Guidelines for working with Gemini 2.5 Flash
- **Cultural Considerations**: Best practices for multilingual and cultural adaptation
- **Architecture Decisions**: Understanding of design patterns and scalability

## 🚀 Development Workflow

### AI-Powered Development
1. **Price Generation**: Use ai-pricing.md guidelines for market-realistic pricing
2. **Translation Features**: Follow translation.md for cultural adaptation
3. **Negotiation Logic**: Implement negotiation.md strategies for fair bargaining
4. **Quality Assurance**: Validate against project.json specifications

### Feature Development
- **Multilingual Support**: Ensure all new features support 5 languages
- **Real-time Integration**: Use Socket.IO patterns for live updates
- **AI Integration**: Follow dedicated API key architecture
- **Cultural Sensitivity**: Maintain Indian marketplace communication patterns

## 📊 Maintenance Guidelines

### Update Steering Files When:
- **Adding New Languages**: Expand beyond current 5-language support
- **Modifying AI Services**: Changes to Gemini integration or prompts
- **Updating Market Logic**: Changes to pricing or negotiation strategies
- **Expanding Features**: New marketplace functionality or payment methods

### Update project.json When:
- **Version Changes**: Major feature additions or architectural changes
- **Dependency Updates**: Technology stack modifications
- **Performance Improvements**: Updated metrics or optimization targets
- **Deployment Changes**: Environment or configuration updates

## 🎯 Quality Standards

### Code Quality
- **AI-First Architecture**: No hardcoded responses, pure AI system
- **Cultural Sensitivity**: Respectful communication in all languages
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Performance**: Real-time responsiveness with < 5s AI response times

### Documentation Quality
- **Comprehensive Coverage**: All features and services documented
- **Cultural Context**: Indian marketplace considerations included
- **Technical Accuracy**: Correct API usage and configuration details
- **Maintenance Guidelines**: Clear update and modification procedures

## 🌟 Project Achievements

### Technical Excellence
- **Pure AI System**: No fallback prices or hardcoded responses
- **5-Language Support**: Comprehensive multilingual implementation
- **Real-time Architecture**: Live synchronization between vendor and customer
- **Cultural Intelligence**: Beyond translation - cultural adaptation

### Business Value
- **Market-Ready**: Production-ready platform for Indian local trade
- **Scalable Design**: Horizontal scaling with stateless architecture
- **User-Friendly**: Voice integration and cultural sensitivity
- **Payment Integration**: UPI and cash payment support

---

**This configuration enables Kiro to provide intelligent, culturally-sensitive assistance for the Multilingual Mandi platform, ensuring consistent quality and cultural appropriateness across all AI-powered features.**