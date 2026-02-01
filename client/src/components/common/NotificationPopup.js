import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, MessageSquarePlus, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';

const NotificationPopup = ({ 
  isOpen, 
  onClose, 
  type = 'info', // 'info', 'warning', 'error', 'success'
  title,
  message,
  showBackButton = true,
  showMessageButton = true,
  onSendMessage,
  customActions = null
}) => {
  const { t } = useTranslation();
  const { language } = useSocket();
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = getLanguageCode(language);
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Speech recognized:', transcript, 'in language:', language);
        setVoiceMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error, 'for language:', language);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert(t('noSpeechDetected'));
        } else if (event.error === 'network') {
          alert(t('networkError'));
        } else {
          alert(`${t('voiceRecognitionError')}: ${event.error}. ${t('pleaseRetryAgain')}.`);
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [language]);

  const getLanguageCode = (language) => {
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'tamil': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN'
    };
    console.log('🎤 Setting speech recognition language:', language, '→', langMap[language] || 'en-US');
    return langMap[language] || 'en-US';
  };

  const startListening = () => {
    if (recognition && !isListening) {
      console.log('🎤 Starting speech recognition for language:', language);
      setIsListening(true);
      try {
        recognition.start();
      } catch (error) {
        console.error('❌ Speech recognition start error:', error);
        setIsListening(false);
        alert(t('speechRecognitionFailed'));
      }
    } else if (!recognition) {
      console.error('❌ Speech recognition not supported');
      alert(t('voiceInputNotSupported'));
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSendVoiceMessage = () => {
    if (voiceMessage.trim()) {
      console.log('📤 Sending voice message:', voiceMessage.trim());
      // Use the same onSendMessage callback that handles proper socket communication
      onSendMessage(voiceMessage.trim());
      setVoiceMessage('');
      setShowVoiceInput(false);
      onClose();
    }
  };

  const handleVoiceInputToggle = () => {
    setShowVoiceInput(!showVoiceInput);
    setVoiceMessage('');
    setIsListening(false);
  };

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800'
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bharat-border">
          <h3 className="text-lg font-semibold text-bharat-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-bharat-muted hover:text-bharat-primary transition-colors p-1 rounded-lg hover:bg-bharat-background"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message with type styling */}
          <div className={`p-4 ${typeStyles.bgColor} border ${typeStyles.borderColor} rounded-lg mb-6`}>
            <p className={`${typeStyles.titleColor} text-sm leading-relaxed`}>
              {message}
            </p>
          </div>

          {/* Actions */}
          {customActions ? (
            customActions
          ) : showVoiceInput ? (
            /* Voice Input Mode */
            <div className="space-y-3">
              <div className="p-3 bg-bharat-background rounded-lg border">
                <p className="text-sm text-bharat-muted mb-2">Voice Message:</p>
                <div className="flex items-center space-x-2 mb-3">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-bharat-primary text-white hover:bg-opacity-90'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    {isListening ? (
                      <p className="text-sm text-blue-600 animate-pulse">🎤 Listening... Speak now</p>
                    ) : voiceMessage ? (
                      <p className="text-sm text-bharat-primary">"{voiceMessage}"</p>
                    ) : (
                      <p className="text-sm text-bharat-muted">Tap microphone to start</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSendVoiceMessage}
                  disabled={!voiceMessage.trim()}
                  className="flex-1 bg-bharat-negotiation text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  Send Voice Message
                </button>
                <button
                  onClick={handleVoiceInputToggle}
                  className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Regular Actions */
            <div className="flex space-x-2">
              {showBackButton && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-bharat-primary text-white py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center font-medium text-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t('back')}
                </button>
              )}
              
              {showMessageButton && onSendMessage && (
                <button
                  onClick={() => onSendMessage()} // Call without parameters to trigger message panel
                  className="flex-1 bg-bharat-negotiation text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center font-medium text-sm"
                >
                  <MessageSquarePlus className="w-4 h-4 mr-1" />
                  {t('sendMessage')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;