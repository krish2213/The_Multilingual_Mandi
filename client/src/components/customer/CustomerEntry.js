import React, { useState } from 'react';
import { ChevronRight, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import SpeakButton from '../common/SpeakButton';

const CustomerEntry = ({ onJoinSuccess }) => {
  const [sessionId, setSessionId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [joining, setJoining] = useState(false);
  const { joinSession } = useSocket();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' }
  ];

  const handleJoinSession = () => {
    if (!sessionId.trim()) {
      alert('Please enter a valid Session ID');
      return;
    }

    setJoining(true);
    i18n.changeLanguage(selectedLanguage);
    joinSession(sessionId.toUpperCase(), selectedLanguage);
    
    // Simulate join process
    setTimeout(() => {
      setJoining(false);
      onJoinSuccess({ sessionId, language: selectedLanguage });
    }, 1000);
  };

  const handleSessionIdChange = (e) => {
    // Convert to uppercase and limit to 6 characters
    const value = e.target.value.toUpperCase().slice(0, 6);
    setSessionId(value);
  };

  return (
    <div className="min-h-screen bg-bharat-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h2 className="text-3xl font-bold text-bharat-primary">
                {t('customer')} Entry
              </h2>
              <SpeakButton 
                text={`${t('customer')} Entry`} 
                language={selectedLanguage} 
                size="md"
              />
            </div>
            <p className="text-bharat-muted">
              Join an active selling session
            </p>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <label className="text-sm font-medium text-bharat-primary">
                {t('language')}
              </label>
              <SpeakButton 
                text={t('language')} 
                language={selectedLanguage} 
                size="sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-sm
                    ${selectedLanguage === lang.code
                      ? 'border-bharat-primary bg-bharat-primary bg-opacity-5'
                      : 'border-bharat-border hover:border-bharat-primary'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="font-medium text-bharat-primary">
                      {lang.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session ID Input */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <label className="text-sm font-medium text-bharat-primary">
                {t('sessionId')}
              </label>
              <SpeakButton 
                text={t('sessionId')} 
                language={selectedLanguage} 
                size="sm"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-bharat-muted" />
              </div>
              <input
                type="text"
                value={sessionId}
                onChange={handleSessionIdChange}
                placeholder="Enter 6-digit code"
                className="w-full pl-10 pr-4 py-3 border border-bharat-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength="6"
              />
            </div>
            <p className="text-xs text-bharat-muted mt-2">
              {t('enterSessionId')} provided by the vendor
            </p>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinSession}
            disabled={!sessionId.trim() || joining}
            className={`
              w-full flex items-center justify-center space-x-2 py-3 rounded-lg
              font-medium transition-all duration-200
              ${sessionId.trim() && !joining
                ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                : 'bg-bharat-border text-bharat-muted cursor-not-allowed'
              }
            `}
          >
            {joining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>{t('joinSession')}</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-bharat-background rounded-lg">
            <h4 className="font-medium text-bharat-primary mb-2">
              How to join:
            </h4>
            <ol className="text-sm text-bharat-muted space-y-1">
              <li>1. Get the 6-digit Session ID from the vendor</li>
              <li>2. Select your preferred language</li>
              <li>3. Enter the Session ID and click Join</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEntry;