import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Mic, MicOff, Volume2 } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import SpeakButton from './SpeakButton';
import toast from 'react-hot-toast';

const CustomMessagePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const { socket, sendCustomMessage, role, language, sessionId } = useSocket();
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);

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
        setMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition failed. Please try again.');
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
        
        // Show toast notification with sound button
        if (data.notification) {
          toast.success('New message received', {
            duration: 4000,
            icon: '💬',
            action: {
              label: '🔊',
              onClick: () => speakMessage(data.message.indirect)
            }
          });
        }
      };

      const handleMessageSent = () => {
        setIsProcessing(false);
        toast.success('Message sent successfully');
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
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN'
    };
    return langMap[language] || 'en-US';
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(language);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      // Find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(getLanguageCode(language).split('-')[0])
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
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
      
      // Send enhanced message with language info
      if (socket && sessionId) {
        socket.emit('send-custom-message', {
          sessionId,
          message: message.trim(),
          senderRole: role,
          senderLanguage: language,
          recipientLanguage: 'en' // Could be dynamic based on other user's preference
        });
      } else {
        // Fallback to old method
        sendCustomMessage(message);
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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 bg-bharat-primary text-white rounded-full
          shadow-lg hover:shadow-xl transition-all duration-300
          flex items-center justify-center
          hover:bg-opacity-90
          ${isOpen ? 'hidden' : 'block'}
        `}
        title={t('customMessage')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Message Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-96 bg-white rounded-lg shadow-2xl border border-bharat-border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-bharat-border">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-bharat-primary" />
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
          <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-bharat-muted text-sm">
                No messages yet. Start a conversation!
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
                    {msg.culturalNote && (
                      <div className="text-xs opacity-75 mt-1 italic">
                        {msg.culturalNote}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-bharat-border">
            <div className="flex space-x-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessage')}
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
                🎤 Listening... Speak now
              </p>
            )}
            
            {isProcessing && (
              <p className="text-sm text-gray-600 mt-2">
                Processing message...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomMessagePanel;