// Enhanced Speech Utilities with better browser support and error handling

class SpeechUtils {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voices = [];
    
    // Initialize voices
    this.loadVoices();
    
    // Handle voices loaded event
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  loadVoices() {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
    }
  }

  // Initialize Speech Recognition
  initializeSpeechRecognition(language = 'en-US', onResult, onError, onEnd) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = language;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      if (onResult) {
        onResult(transcript, confidence);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) {
        onEnd();
      }
    };

    return this.recognition;
  }

  // Start listening
  startListening() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      return true;
    }
    return false;
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      return true;
    }
    return false;
  }

  // Text-to-Speech
  speak(text, options = {}) {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Find appropriate voice
    const preferredVoice = this.findVoice(utterance.lang, options.voiceGender);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Event handlers
    if (options.onStart) {
      utterance.onstart = options.onStart;
    }
    
    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }
    
    if (options.onError) {
      utterance.onerror = options.onError;
    }

    this.synthesis.speak(utterance);
    return utterance;
  }

  // Find the best voice for a language
  findVoice(language, preferredGender = null) {
    const langCode = language.split('-')[0];
    
    // Filter voices by language
    let matchingVoices = this.voices.filter(voice => 
      voice.lang.startsWith(langCode) || voice.lang.startsWith(language)
    );

    if (matchingVoices.length === 0) {
      // Fallback to any voice
      matchingVoices = this.voices;
    }

    // Prefer local voices
    const localVoices = matchingVoices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      matchingVoices = localVoices;
    }

    // Apply gender preference if specified
    if (preferredGender && matchingVoices.length > 1) {
      const genderVoices = matchingVoices.filter(voice => 
        voice.name.toLowerCase().includes(preferredGender.toLowerCase())
      );
      if (genderVoices.length > 0) {
        matchingVoices = genderVoices;
      }
    }

    return matchingVoices[0] || null;
  }

  // Stop current speech
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Check if currently speaking
  isSpeaking() {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  // Get available voices
  getVoices() {
    return this.voices;
  }

  // Get voices for a specific language
  getVoicesForLanguage(language) {
    const langCode = language.split('-')[0];
    return this.voices.filter(voice => 
      voice.lang.startsWith(langCode) || voice.lang.startsWith(language)
    );
  }

  // Language code mapping
  static getLanguageCode(language) {
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN'
    };
    return langMap[language] || language || 'en-US';
  }

  // Check browser support
  static checkSupport() {
    return {
      speechRecognition: ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window),
      speechSynthesis: 'speechSynthesis' in window,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices
    };
  }
}

// Create singleton instance
const speechUtils = new SpeechUtils();

export default speechUtils;

// Named exports for specific functions
export const {
  initializeSpeechRecognition,
  startListening,
  stopListening,
  speak,
  stopSpeaking,
  isSpeaking,
  getVoices,
  getVoicesForLanguage
} = speechUtils;

export { SpeechUtils };