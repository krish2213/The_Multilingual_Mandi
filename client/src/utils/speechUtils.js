// Enhanced Speech Utilities with ResponsiveVoice TTS
// Completely replaces browser TTS with ResponsiveVoice for better multilingual support

class SpeechUtils {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    
    // ResponsiveVoice voice mappings for consistent male voices
    this.voiceMap = {
      'en': 'UK English Male',
      'hi': 'Hindi Male',
      'ta': 'Tamil Male',
      'te': 'Telugu Male',
      'kn': 'Kannada Male',
      'ml': 'Malayalam Male',
      'bn': 'Bengali Male',
      'gu': 'Gujarati Male',
      'mr': 'Marathi Male',
      'pa': 'Punjabi Male'
    };
  }

  // Initialize Speech Recognition (keep existing functionality)
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

  // Text-to-Speech using ResponsiveVoice
  speak(text, options = {}) {
    if (!window.responsiveVoice) {
      console.error('ResponsiveVoice not loaded yet');
      
      // Try to wait for ResponsiveVoice to load
      const waitForRV = (attempts = 0) => {
        if (attempts > 10) {
          throw new Error('ResponsiveVoice not available after waiting');
        }
        
        if (window.responsiveVoice) {
          this.speak(text, options); // Retry the speak call
        } else {
          setTimeout(() => waitForRV(attempts + 1), 500);
        }
      };
      
      waitForRV();
      return;
    }

    // Stop any ongoing speech
    this.stopSpeaking();

    // Get language from options
    const language = options.lang || 'en-US';
    const langCode = language.split('-')[0];
    
    // Get appropriate voice
    const voiceName = this.voiceMap[langCode] || 'UK English Male';
    
    console.log('🔊 ResponsiveVoice speaking:', text, 'with voice:', voiceName);

    // ResponsiveVoice options
    const rvOptions = {
      pitch: options.pitch || 1,
      rate: options.rate || 0.9,
      volume: options.volume || 1,
      onstart: () => {
        this.isSpeaking = true;
        if (options.onStart) options.onStart();
      },
      onend: () => {
        this.isSpeaking = false;
        if (options.onEnd) options.onEnd();
      },
      onerror: () => {
        this.isSpeaking = false;
        if (options.onError) options.onError();
      }
    };

    // Speak using ResponsiveVoice
    window.responsiveVoice.speak(text, voiceName, rvOptions);
    
    return { text, voiceName, options: rvOptions };
  }

  // Stop current speech
  stopSpeaking() {
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
      this.isSpeaking = false;
    }
  }

  // Check if currently speaking
  isSpeaking() {
    return this.isSpeaking || (window.responsiveVoice && window.responsiveVoice.isPlaying());
  }

  // Get available voices (ResponsiveVoice voices)
  getVoices() {
    if (window.responsiveVoice) {
      return window.responsiveVoice.getVoices();
    }
    return [];
  }

  // Get voices for a specific language
  getVoicesForLanguage(language) {
    const langCode = language.split('-')[0];
    const voiceName = this.voiceMap[langCode];
    return voiceName ? [{ name: voiceName, lang: language }] : [];
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

  // Check browser support (ResponsiveVoice support)
  static checkSupport() {
    return {
      speechRecognition: ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window),
      speechSynthesis: !!window.responsiveVoice, // ResponsiveVoice instead of browser TTS
      getUserMedia: 'getUserMedia' in navigator.mediaDevices
    };
  }

  // Test ResponsiveVoice availability
  static testResponsiveVoice() {
    if (!window.responsiveVoice) {
      console.error('❌ ResponsiveVoice not loaded. Please check the script tag.');
      return false;
    }
    
    console.log('✅ ResponsiveVoice loaded successfully');
    console.log('🎤 Available voices:', window.responsiveVoice.getVoices().map(v => v.name));
    return true;
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