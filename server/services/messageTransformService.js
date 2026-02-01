const { GoogleGenerativeAI } = require('@google/generative-ai');

class MessageTransformService {
  constructor() {
    const politeApiKey = process.env.GEMINI_POLITE_KEY;
    const translateApiKey = process.env.GEMINI_TRANSLATE_KEY;
    
    if (!politeApiKey || politeApiKey === 'your_new_gemini_api_key_here') {
      throw new Error('❌ NO GEMINI_POLITE_KEY FOUND! Add GEMINI_POLITE_KEY to .env file.');
    }
    
    if (!translateApiKey || translateApiKey === 'your_new_gemini_api_key_here') {
      throw new Error('❌ NO GEMINI_TRANSLATE_KEY FOUND! Add GEMINI_TRANSLATE_KEY to .env file.');
    }
    
    this.initializeModels(politeApiKey, translateApiKey);
  }

  initializeModels(politeApiKey, translateApiKey) {
    const politeGenAI = new GoogleGenerativeAI(politeApiKey);
    const translateGenAI = new GoogleGenerativeAI(translateApiKey);
    
    // Dedicated model for translation
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
    
    console.log('✅ Message Transform initialized with dedicated models (gemini-2.5-flash)');
  }

  async transformMessage(text, senderRole, senderLanguage, recipientLanguage) {
    console.log(`🔄 Transform: "${text}" from ${senderLanguage} to ${recipientLanguage}`);
    
    try {
      // CHECKPOINT: If both languages are the same, skip translation and only do polite conversion
      if (senderLanguage === recipientLanguage) {
        console.log(`✅ Same language detected (${senderLanguage}), skipping translation - only polite conversion`);
        
        const politePrompt = `Convert this ${senderLanguage} message to polite third-person speech for an Indian marketplace:

Original ${senderLanguage} message: "${text}"
Speaker: ${senderRole}

Make it polite and indirect in ${senderLanguage}. Respond with only the polite ${senderLanguage} version.

Examples:
English: "I cannot go below 40 rupees" → "The vendor respectfully explains that the current market conditions do not allow pricing below 40 rupees"
Hindi: "मैं 40 रुपये से नीचे नहीं जा सकता" → "विक्रेता ने विनम्रता से बताया कि बाजार की स्थिति 40 रुपये से कम दाम की अनुमति नहीं देती"
Tamil: "40 ரூபாய்க்கு கீழே குறைக்க முடியாது" → "விற்பனையாளர் மரியாதையுடன் தெரிவிக்கிறார் कि சந்தை நிலைமைகள் 40 ரூபாய்க்கு கீழே விலை நிர்ணயம் செய்ய அனுமதிக்காது"

Now convert: "${text}"`;
        
        console.log('🚀 Calling polite conversion model (same language)...');
        const politeResult = await this.politeModel.generateContent(politePrompt);
        const politeMessage = politeResult.response.text().trim();
        
        console.log(`✅ Polite conversion complete: "${politeMessage}"`);
        
        return {
          original: text,
          translated: politeMessage, // Same as indirect since no translation needed
          indirect: politeMessage,
          culturalNote: `Polite ${senderLanguage} marketplace communication (no translation needed)`,
          senderRole,
          timestamp: new Date().toISOString()
        };
      }
      
      // DIFFERENT LANGUAGES: Full translation + polite conversion process
      console.log(`🌐 Different languages detected, performing full translation process`);
      
      // Step 1: Convert to polite indirect speech in ORIGINAL language first
      const politePrompt = `Convert this ${senderLanguage} message to polite third-person speech for an Indian marketplace:

Original ${senderLanguage} message: "${text}"
Speaker: ${senderRole}

Make it polite and indirect in ${senderLanguage}. Respond with only the polite ${senderLanguage} version.

Examples:
English: "I cannot go below 40 rupees" → "The vendor respectfully explains that the current market conditions do not allow pricing below 40 rupees"
Hindi: "मैं 40 रुपये से नीचे नहीं जा सकता" → "विक्रेता ने विनम्रता से बताया कि बाजार की स्थिति 40 रुपये से कम दाम की अनुमति नहीं देती"
Tamil: "40 ரூபாய்க்கு கீழே குறைக்க முடியாது" → "விற்பனையாளர் மரியாதையுடன் தெரிவிக்கிறார் கि சந்தை நிலைமைகள் 40 ரூபாய்க்கு கீழே விலை நிர்ணயம் செய்ய அனுமதிக்காது"

Now convert: "${text}"`;
      
      console.log('🚀 Calling polite conversion model (original language)...');
      const politeResult = await this.politeModel.generateContent(politePrompt);
      const politeOriginal = politeResult.response.text().trim();
      
      console.log(`🔍 Polite original: "${politeOriginal}"`);
      
      // Step 2: Translate the polite version to recipient language
      const translationPrompt = `Translate this polite ${senderLanguage} text to ${recipientLanguage}: "${politeOriginal}"

Provide only the complete translation, nothing else.`;
      
      console.log('🚀 Calling translation model...');
      const translationResult = await this.translationModel.generateContent(translationPrompt);
      const rawResponse = translationResult.response.text();
      const finalTranslation = rawResponse.trim();
      
      console.log(`✅ Final translation: "${finalTranslation}"`);
      
      // Step 3: Add cultural context
      const culturalNote = `Respectful ${senderLanguage} to ${recipientLanguage} marketplace communication`;

      console.log(`✅ Translation complete:`);
      console.log(`   Original: "${text}"`);
      console.log(`   Polite (${senderLanguage}): "${politeOriginal}"`);
      console.log(`   Final (${recipientLanguage}): "${finalTranslation}"`);
      console.log(`   Cultural: "${culturalNote}"`);

      return {
        original: text,
        translated: finalTranslation,
        indirect: finalTranslation,
        culturalNote: culturalNote,
        senderRole,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Transform error:', error.message);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
    ];
  }
}

module.exports = MessageTransformService;