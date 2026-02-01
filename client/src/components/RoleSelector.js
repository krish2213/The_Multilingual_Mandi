import React, { useState } from 'react';
import { Store, ShoppingCart, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SpeakButton from './common/SpeakButton';

const RoleSelector = ({ onRoleSelect }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRole, setSelectedRole] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' }
  ];

  const roles = [
    {
      key: 'vendor',
      title: t('vendor'),
      description: t('startSelling'),
      icon: Store,
      color: 'bg-bharat-success',
      hoverColor: 'hover:bg-bharat-success'
    },
    {
      key: 'customer',
      title: t('customer'),
      description: t('joinSession'),
      icon: ShoppingCart,
      color: 'bg-bharat-primary',
      hoverColor: 'hover:bg-bharat-primary'
    }
  ];

  const handleRoleClick = (roleKey) => {
    setSelectedRole(roleKey);
  };

  const handleContinue = () => {
    // Set the language before proceeding
    i18n.changeLanguage(selectedLanguage);
    onRoleSelect(selectedRole, selectedLanguage);
  };

  const handleSpeakClick = (e) => {
    // Prevent event bubbling to avoid triggering role selection
    e.stopPropagation();
  };

  const canContinue = selectedLanguage && selectedRole;

  return (
    <div className="min-h-screen bg-bharat-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold text-bharat-primary">
              {t('welcome')}
            </h1>
            <div onClick={handleSpeakClick}>
              <SpeakButton 
                text={t('welcome')} 
                language={selectedLanguage} 
                size="md"
              />
            </div>
          </div>
          <p className="text-bharat-muted text-lg">
            {t('selectRole')}
          </p>
        </div>

        {/* Language Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h3 className="text-xl font-semibold text-bharat-primary">
              {t('language')}
            </h3>
            <div onClick={handleSpeakClick}>
              <SpeakButton 
                text={t('language')} 
                language={selectedLanguage} 
                size="sm"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200
                    ${selectedLanguage === lang.code
                      ? 'border-bharat-primary bg-bharat-primary bg-opacity-10'
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
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.key;
            return (
              <div
                key={role.key}
                onClick={() => handleRoleClick(role.key)}
                className={`
                  group cursor-pointer
                  bg-white rounded-xl shadow-lg border-2 transition-all duration-300
                  p-8 text-center hover:shadow-xl hover:scale-105
                  ${isSelected 
                    ? 'border-bharat-primary bg-bharat-primary bg-opacity-5' 
                    : 'border-bharat-border hover:border-bharat-primary'
                  }
                  ${role.hoverColor} hover:bg-opacity-5
                `}
              >
                <div className={`
                  w-20 h-20 mx-auto mb-6 rounded-full
                  ${role.color} bg-opacity-10
                  flex items-center justify-center
                  group-hover:bg-opacity-20 transition-all duration-300
                  ${isSelected ? 'bg-opacity-20' : ''}
                `}>
                  <IconComponent className={`w-10 h-10 text-bharat-primary`} />
                </div>
                
                <div className="mb-3">
                  <h3 className="text-2xl font-semibold text-bharat-primary mb-2">
                    {role.title}
                  </h3>
                  <div className="flex justify-center" onClick={handleSpeakClick}>
                    <SpeakButton 
                      text={role.title} 
                      language={selectedLanguage} 
                      size="sm"
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-bharat-muted mb-2">
                    {role.description}
                  </p>
                  <div className="flex justify-center" onClick={handleSpeakClick}>
                    <SpeakButton 
                      text={role.description} 
                      language={selectedLanguage} 
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`
              flex items-center space-x-2 px-8 py-3 rounded-lg
              font-medium transition-all duration-200 text-lg
              ${canContinue
                ? 'bg-bharat-primary text-white hover:bg-opacity-90 shadow-lg hover:shadow-xl'
                : 'bg-bharat-border text-bharat-muted cursor-not-allowed'
              }
            `}
          >
            <span>{t('continue')}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-bharat-muted text-sm">
            {!selectedLanguage && !selectedRole && "Select your language and role, then click continue"}
            {selectedLanguage && !selectedRole && "Now select your role"}
            {!selectedLanguage && selectedRole && "Please select a language"}
            {selectedLanguage && selectedRole && "Ready to continue!"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;