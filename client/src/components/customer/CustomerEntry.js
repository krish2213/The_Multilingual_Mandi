import React, { useState, useEffect } from 'react';
import { ChevronRight, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import SpeakButton from '../common/SpeakButton';

const CustomerEntry = ({ onJoinSuccess, preSelectedLanguage }) => {
  const [sessionId, setSessionId] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinSession } = useSocket();
  const { t, i18n } = useTranslation();

  // Use pre-selected language from RoleSelector
  useEffect(() => {
    if (preSelectedLanguage) {
      i18n.changeLanguage(preSelectedLanguage);
    }
  }, [preSelectedLanguage, i18n]);

  const handleJoinSession = () => {
    if (!sessionId.trim()) {
      alert(t('pleaseEnterValidSessionId'));
      return;
    }

    setJoining(true);
    joinSession(sessionId.toUpperCase(), preSelectedLanguage || 'en');
    
    // Simulate join process
    setTimeout(() => {
      setJoining(false);
      onJoinSuccess({ sessionId, language: preSelectedLanguage || 'en' });
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
                {t('customer')} {t('entry')}
              </h2>
              <SpeakButton 
                text={`${t('customer')} ${t('entry')}`} 
                language={preSelectedLanguage || 'en'} 
                size="md"
              />
            </div>
            <p className="text-bharat-muted">
              {t('joinActiveSellingSession')}
            </p>
          </div>

          {/* Session ID Input */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <label className="text-sm font-medium text-bharat-primary">
                {t('sessionId')}
              </label>
              <SpeakButton 
                text={t('sessionId')} 
                language={preSelectedLanguage || 'en'} 
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
                placeholder={t('enterSixDigitCode')}
                className="w-full pl-10 pr-4 py-3 border border-bharat-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength="6"
              />
            </div>
            <p className="text-xs text-bharat-muted mt-2 text-center">
              {t('enterSessionId')} {t('providedByVendor')}
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
                <span>{t('joining')}</span>
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
              {t('howToJoin')}:
            </h4>
            <ol className="text-sm text-bharat-muted space-y-1">
              <li>1. {t('getSessionIdFromVendor')}</li>
              <li>2. {t('enterSessionIdAndJoin')}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEntry;