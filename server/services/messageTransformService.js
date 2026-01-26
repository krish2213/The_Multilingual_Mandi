const { GoogleGenerativeAI } = require('@google/generative-ai');

const MessageSchema = {
  type: "object",
  properties: {
    indirectMessage: { 
      type: "string", 
      description: "The polite, third-person version of the message in the recipient's language" 
    },
    detectedSentiment: { 
      type: "string", 
      enum: ["positive", "neutral", "frustrated", "negotiating"],
      description: "The emotional tone of the original message"
    }
  },
  required: ["indirectMessage", "detectedSentiment"]
};
class MessageTransformService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY_3;
    const ai = new GoogleGenerativeAI(this.apiKey);
    
    // Using 2.5-flash for better Indic language reasoning
    this.model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: MessageSchema,
        temperature: 0.1
      }
    });
  }

  async transformMessage(text, senderRole, recipientLanguage, senderLanguage = null) {
    // Step 1: Detect language if not provided
    let detectedLanguage = senderLanguage;
    if (!detectedLanguage) {
      detectedLanguage = await this.detectLanguage(text);
    }
    
    console.log(`🌐 Language: ${detectedLanguage} → ${recipientLanguage}`);
    
    // Step 2: If languages are the same, just format without translation
    if (detectedLanguage.toLowerCase() === recipientLanguage.toLowerCase()) {
      return await this.formatMessageOnly(text, senderRole, recipientLanguage);
    }
    
    // Step 3: Translate and format
    const prompt = `
      You are a professional marketplace mediator.
      
      ORIGINAL MESSAGE from ${senderRole}: "${text}"
      ORIGINAL LANGUAGE: ${detectedLanguage}
      TARGET LANGUAGE: ${recipientLanguage}
      RECIPIENT SPEAKS: ${recipientLanguage}
      
      TASK:
      1. DETECT the emotional tone of the original message
      2. TRANSLATE the message from ${detectedLanguage} to ${recipientLanguage}
      3. CONVERT to polite third-person formal speech
      4. REMOVE all slang and informal expressions
      
      IMPORTANT: Output must be in ${recipientLanguage}
      
      OUTPUT FORMAT (JSON):
      {
        "indirectMessage": "The translated and formatted message in ${recipientLanguage}",
        "detectedSentiment": "positive|neutral|frustrated|negotiating"
      }
      
      EXAMPLES:
      
      Example 1 (Tamil → English):
      Original: "சிறிது விலையை குறையுங்கள்"
      Output: {
        "indirectMessage": "The customer is requesting a slight reduction in the price.",
        "detectedSentiment": "negotiating"
      }
      
      Example 2 (Hindi → English):
      Original: "थोड़ा कम कर दो भाई"
      Output: {
        "indirectMessage": "The customer is asking for a small reduction in the price.",
        "detectedSentiment": "negotiating"
      }
      
      Example 3 (English → Tamil):
      Original: "Can you reduce the price?"
      Output: {
        "indirectMessage": "வாடிக்கையாளர் விலையை குறைக்குமாறு கேட்டுக்கொள்கிறார்.",
        "detectedSentiment": "negotiating"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = responseText.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      return {
        original: text,
        indirect: data.indirectMessage,
        sentiment: data.detectedSentiment,
        senderRole,
        fromLanguage: detectedLanguage,
        toLanguage: recipientLanguage
      };
    } catch (error) {
      console.error("Transformation Error:", error);
      return { 
        original: text, 
        indirect: text, 
        sentiment: 'neutral',
        error: error.message 
      };
    }
  }
  
  async detectLanguage(text) {
    const cleanText = text.trim();
    
    // Check Unicode ranges FIRST
    if (/[\u0B80-\u0BFF]/.test(cleanText)) return "Tamil";
    if (/[\u0900-\u097F]/.test(cleanText)) return "Hindi";
    if (/[\u0C00-\u0C7F]/.test(cleanText)) return "Telugu";
    if (/[\u0C80-\u0CFF]/.test(cleanText)) return "Kannada";
    if (/[\u0D00-\u0D7F]/.test(cleanText)) return "Malayalam";
    
    // English check
    if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(cleanText)) return "English";
    
    return "English"; // Default fallback
}
  
  async formatMessageOnly(text, senderRole, language) {
    // Format message without translation (when languages are same)
    const prompt = `
      Format this message in ${language} into polite third-person formal speech.
      
      Original from ${senderRole}: "${text}"
      
      Instructions:
      - Convert to 3rd person (e.g., "The customer suggests..." instead of "I want...")
      - Make it formal and polite
      - Remove slang
      - Keep it in ${language}
      
      Return JSON: {
        "indirectMessage": "formatted message",
        "detectedSentiment": "positive|neutral|frustrated|negotiating"
      }
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = responseText.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      return {
        original: text,
        indirect: data.indirectMessage,
        sentiment: data.detectedSentiment,
        senderRole,
        fromLanguage: language,
        toLanguage: language,
        note: "Formatted only (no translation needed)"
      };
    } catch (error) {
      console.error("Formatting Error:", error);
      return {
        original: text,
        indirect: text,
        sentiment: 'neutral',
        senderRole
      };
    }
  }
}
module.exports = MessageTransformService;