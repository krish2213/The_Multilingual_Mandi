import React, { useState, useEffect } from 'react';
import { X, MessageSquarePlus, ChevronLeft, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';

const CustomerFeedbackPopup = ({ 
  negotiationResponse, 
  product, 
  onBack, 
  onSendMessage, 
  onClose 
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [recognition, setRecognition] = useState(null);
  const { t } = useTranslation();
  const { language } = useSocket();

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

  const handleVoiceInputToggle = () => {
    setShowVoiceInput(!showVoiceInput);
    setVoiceMessage('');
    setIsListening(false);
  };

  // Extract data from the complex structure
  const negotiation = negotiationResponse.negotiation || negotiationResponse;
  const response = negotiationResponse.response || negotiationResponse;
  const actualProduct = negotiationResponse.product || product;

  // Debug logging to understand data structure
  console.log('🔍 CustomerFeedbackPopup received:', {
    negotiationResponse,
    negotiation,
    response,
    actualProduct,
    proposedPrice: negotiation.proposedPrice,
    customerOffer: negotiation.customerOffer
  });

  const handleSendMessage = () => {
    if (customMessage.trim()) {
      onSendMessage(customMessage.trim());
      onClose();
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '₹--';
    return `₹${price}`;
  };

  const getStatusMessage = () => {
    const action = response.action || negotiation.status;
    
    if (action === 'accepted') {
      return {
        title: t('offerAcceptedTitle'),
        message: t('offerAcceptedMessage'),
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        icon: ''
      };
    } else if (action === 'rejected') {
      return {
        title: t('offerRejectedTitle'),
        message: t('offerRejectedMessage'),
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: '❌'
      };
    } else if (action === 'custom_message') {
      return {
        title: t('vendorMessage'),
        message: response.message || negotiation.message,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: '💬'
      };
    }
    return null;
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-bharat-primary text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <MessageSquarePlus className="w-5 h-5 mr-2" />
              {t('vendorResponse')}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          <div className="mb-4 p-3 bg-bharat-background rounded-lg">
            <h4 className="font-medium text-bharat-primary mb-2">{actualProduct?.name}</h4>
            <div className="text-sm text-bharat-muted space-y-1">
              <div className="flex justify-between">
                <span>{t('yourOffer')}:</span>
                <span className="font-semibold text-bharat-negotiation">
                  {formatPrice(
                    negotiation.proposedPrice || 
                    negotiation.customerOffer ||
                    response.proposedPrice ||
                    response.customerOffer
                  )}{t('perKg')}
                </span>
              </div>
              {(response.counterPrice || response.vendorPrice || negotiation.counterPrice) && (
                <div className="flex justify-between">
                  <span>{t('vendorCounter')}:</span>
                  <span className="font-semibold text-bharat-success">
                    {formatPrice(
                      response.counterPrice || 
                      response.vendorPrice ||
                      negotiation.counterPrice
                    )}{t('perKg')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {statusInfo && (
            <div className={`mb-6 p-3 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg`}>
              <p className={`${statusInfo.textColor} text-sm`}>
                {statusInfo.icon} {statusInfo.message}
              </p>
            </div>
          )}

          {!showMessageForm ? (
            /* Action Buttons - Small and in one line */
            <div className="flex space-x-2">
              <button
                onClick={onBack}
                className="flex-1 bg-bharat-primary text-white py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </button>
              
              <button
                onClick={() => setShowMessageForm(true)}
                className="flex-1 bg-bharat-negotiation text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center font-medium text-sm"
              >
                <MessageSquarePlus className="w-4 h-4 mr-1" />
                {t('sendMessage')}
              </button>
            </div>
          ) : (
            /* Custom Message Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bharat-primary mb-2">
                  {t('messageToVendor')}
                </label>
                <div className="relative">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t('typeYourMessage')}
                    className="w-full p-3 pr-12 border border-bharat-border rounded-lg focus:ring-2 focus:ring-bharat-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleVoiceInputToggle}
                    className="absolute right-2 top-2 p-2 text-bharat-muted hover:text-bharat-primary transition-colors"
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Voice Input Section */}
              {showVoiceInput && (
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCustomMessage(voiceMessage);
                        setShowVoiceInput(false);
                        setVoiceMessage('');
                      }}
                      disabled={!voiceMessage.trim()}
                      className="flex-1 bg-bharat-negotiation text-white py-1 px-2 rounded text-xs hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Use Voice Message
                    </button>
                    <button
                      onClick={() => {
                        setShowVoiceInput(false);
                        setVoiceMessage('');
                      }}
                      className="flex-1 bg-gray-500 text-white py-1 px-2 rounded text-xs hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSendMessage}
                  disabled={!customMessage.trim()}
                  className="flex-1 bg-bharat-primary text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('sendMessage')}
                </button>
                
                <button
                  onClick={() => {
                    setShowMessageForm(false);
                    setCustomMessage('');
                    setShowVoiceInput(false);
                    setVoiceMessage('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('back')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFeedbackPopup;