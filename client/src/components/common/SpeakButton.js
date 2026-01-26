import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import speechUtils from '../../utils/speechUtils';

const SpeakButton = ({ text, language = 'en', className = '', size = 'sm' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const support = speechUtils.constructor.checkSupport();
  
  if (!support.speechSynthesis) {
    return null;
  }

  const handleSpeak = () => {
    if (isSpeaking) {
      speechUtils.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const languageCode = speechUtils.constructor.getLanguageCode(language);
      
      speechUtils.speak(text, {
        lang: languageCode,
        rate: 0.9,
        pitch: 1,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  return (
    <button
      onClick={handleSpeak}
      className={`
        inline-flex items-center justify-center
        bg-bharat-primary text-white rounded-full
        hover:bg-opacity-80 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:ring-offset-2
        ${sizeClasses[size]}
        ${className}
        ${isSpeaking ? 'animate-pulse bg-red-500' : ''}
      `}
      title={isSpeaking ? "Stop speaking" : "Read aloud"}
      aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
    >
      {isSpeaking ? <VolumeX className="w-full h-full" /> : <Volume2 className="w-full h-full" />}
    </button>
  );
};

export default SpeakButton;