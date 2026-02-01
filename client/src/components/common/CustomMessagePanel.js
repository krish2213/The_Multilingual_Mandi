import { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, Send, X, Mic, MicOff, Volume2, Bell } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';


const CustomMessagePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [panelHeight, setPanelHeight] = useState(384); // Default height (h-96 = 384px)
  const [isResizing, setIsResizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const { socket, sendCustomMessage, role, language, session } = useSocket();
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY;
      
      // Set min height (200px) and max height (80% of viewport)
      const minHeight = 200;
      const maxHeight = window.innerHeight * 0.8;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
        setMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error, 'for language:', language);
        setIsListening(false);
        if (event.error === 'no-speech') {
          toast.error(t('noSpeechDetected'));
        } else if (event.error === 'network') {
          toast.error(t('networkError'));
        } else {
          toast.error(`${t('voiceRecognitionError')}: ${event.error}. ${t('pleaseRetryAgain')}.`);
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [language]);

  useEffect(() => {
    if (socket) {
      const handleMessageReceived = (data) => {
        setMessages(prev => [...prev, { ...data.message, type: 'received' }]);
        
        // Set unread message indicator if panel is closed
        if (!isOpen) {
          setHasUnreadMessages(true);
        }
        
        // Show professional toast notification
        if (data.notification) {
          toast.success(t('messageReceived'), {
            duration: 4000,
            icon: <Bell className="w-4 h-4" />,
            action: {
              label: <Volume2 className="w-4 h-4" />,
              onClick: () => speakMessage(data.message.indirect)
            }
          });
        }
      };

      const handleMessageSent = () => {
        setIsProcessing(false);
        toast.success(t('messageSent'));
      };

      const handleMessageError = (data) => {
        setIsProcessing(false);
        toast.error(data.message || 'Failed to send message');
      };

      socket.on('custom-message-received', handleMessageReceived);
      socket.on('message-sent', handleMessageSent);
      socket.on('message-error', handleMessageError);

      return () => {
        socket.off('custom-message-received', handleMessageReceived);
        socket.off('message-sent', handleMessageSent);
        socket.off('message-error', handleMessageError);
      };
    }
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        toast.error(t('speechRecognitionFailed'));
      }
    } else if (!recognition) {
      console.error('❌ Speech recognition not supported');
      toast.error(t('voiceInputNotSupported'));
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text) => {
    if (!window.responsiveVoice) {
      console.error('❌ ResponsiveVoice not available');
      toast.error('Text-to-speech not available');
      return;
    }

    // Stop any ongoing speech
    window.responsiveVoice.cancel();
    
    const langCode = getLanguageCode(language);
    
    // ResponsiveVoice voice mapping for male voices
    const voiceMap = {
      'en-US': 'UK English Male',
      'hi-IN': 'Hindi Male',
      'ta-IN': 'Tamil Male',
      'te-IN': 'Telugu Male',
      'kn-IN': 'Kannada Male',
      'ml-IN': 'Malayalam Male',
      'bn-IN': 'Bengali Male',
      'gu-IN': 'Gujarati Male',
      'mr-IN': 'Marathi Male',
      'pa-IN': 'Punjabi Male'
    };
    
    const voiceName = voiceMap[langCode] || 'UK English Male';
    
    console.log('🔊 ResponsiveVoice speaking:', text, 'with voice:', voiceName, 'language:', langCode);
    
    window.responsiveVoice.speak(text, voiceName, {
      pitch: 1,
      rate: 0.9,
      volume: 1,
      onstart: () => {
        console.log('🔊 ResponsiveVoice speech started');
      },
      onend: () => {
        console.log('🔊 ResponsiveVoice speech ended');
      },
      onerror: (error) => {
        console.error('❌ ResponsiveVoice error:', error);
        toast.error('Speech playback failed');
      }
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Add message to local state immediately for better UX
      const messageObj = {
        id: Date.now(),
        original: message,
        indirect: message, // Will be replaced by server response
        senderRole: role,
        timestamp: new Date(),
        type: 'sent'
      };
      
      setMessages(prev => [...prev, messageObj]);
      
      // Send message with proper language detection
      if (socket && session?.id) {
        console.log(`🌐 Sending message: "${message}" from ${role} (${language})`);
        console.log(`📋 Session info:`, {
          vendorLanguage: session.vendorLanguage,
          customerLanguage: session.customerLanguage,
          myRole: role,
          myLanguage: language
        });
        
        // Determine recipient language based on session data
        const recipientLanguage = role === 'vendor' 
          ? session.customerLanguage || 'en'  // If I'm vendor, send to customer's language
          : session.vendorLanguage || 'en';   // If I'm customer, send to vendor's language
        
        console.log(`🎯 Recipient language determined: ${recipientLanguage}`);
        
        socket.emit('send-custom-message', {
          sessionId: session.id,
          message: message.trim(),
          senderRole: role,
          senderLanguage: language,
          recipientLanguage: recipientLanguage
        });
      } else {
        console.error('❌ Missing session or socket info');
        toast.error('Session not found. Please rejoin.');
        setIsProcessing(false);
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear unread messages when panel is opened
  const handleOpenPanel = () => {
    setIsOpen(true);
    setHasUnreadMessages(false);
  };

  return (
    <>
      {/* Floating Action Button with Notification Dot */}
      <button
        onClick={handleOpenPanel}
        data-message-panel
        className={`
          w-14 h-14 bg-bharat-primary text-white rounded-full
          shadow-lg hover:shadow-xl transition-all duration-300
          flex items-center justify-center
          hover:bg-opacity-90 relative
          ${isOpen ? 'hidden' : 'block'}
        `}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
        title={t('customMessage')}
      >
        <MessageSquarePlus className="w-6 h-6" />
        {/* Notification Dot */}
        {hasUnreadMessages && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        )}
      </button>

      {/* Message Panel */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="w-96 bg-white rounded-lg shadow-2xl border border-bharat-border flex flex-col"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            height: `${panelHeight}px`
          }}
        >
          {/* Resize Handle */}
          <div
            className="w-full h-2 cursor-ns-resize hover:bg-bharat-primary hover:bg-opacity-20 transition-colors flex items-center justify-center group"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="w-8 h-1 bg-gray-300 rounded-full group-hover:bg-bharat-primary transition-colors"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-bharat-border flex-shrink-0">
            <div className="flex items-center space-x-2">
              <MessageSquarePlus className="w-5 h-5 text-bharat-primary" />
              <h3 className="font-medium text-bharat-primary">
                {t('customMessage')}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-bharat-muted hover:text-bharat-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-bharat-muted text-sm">
                {t('noMessagesYet')}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`
                    flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  <div
                    className={`
                      max-w-xs p-3 rounded-lg text-sm
                      ${msg.type === 'sent'
                        ? 'bg-bharat-primary text-white'
                        : 'bg-bharat-background border border-bharat-border'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <p className="flex-1">
                        {msg.type === 'received' ? msg.indirect : msg.original}
                      </p>
                      <button
                        onClick={() => speakMessage(msg.type === 'received' ? msg.indirect : msg.original)}
                        className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded"
                        title="Listen to message"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-bharat-border flex-shrink-0">
            <div className="flex space-x-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('typeYourMessageHere')}
                className="flex-1 p-2 border border-bharat-border rounded-md resize-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent"
                rows="1"
                disabled={isProcessing}
              />
              
              {/* Voice Input Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-3 py-2 rounded-md transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isProcessing}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isProcessing}
                className="px-3 py-2 bg-bharat-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {isListening && (
              <p className="text-sm text-blue-600 mt-2 animate-pulse">
                🎤 {t('listeningVoice')} {t('speakNow')}
              </p>
            )}
            
            {isProcessing && (
              <p className="text-sm text-gray-600 mt-2">
                {t('processingMessage')}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomMessagePanel;