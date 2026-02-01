import React, { useState, useEffect } from 'react';
import { ChevronRight, Leaf, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';

const VendorSetup = ({ onSetupComplete, preSelectedLanguage }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { createSession } = useSocket();
  const { t, i18n } = useTranslation();

  // Use pre-selected language from RoleSelector
  useEffect(() => {
    if (preSelectedLanguage) {
      i18n.changeLanguage(preSelectedLanguage);
    }
  }, [preSelectedLanguage, i18n]);

  // ONLY VEGETABLES AND FRUITS - NO FISH OR FLOWERS
  const categories = [
    { 
      key: 'vegetables', 
      label: t('vegetables'), 
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      key: 'fruits', 
      label: t('fruits'), 
      icon: Apple,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const handleCategoryToggle = (categoryKey) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      alert(t('pleaseSelectCategory'));
      return;
    }

    createSession(preSelectedLanguage || 'en', selectedCategories);
    onSetupComplete({ language: preSelectedLanguage || 'en', categories: selectedCategories });
  };

  const handleSpeakClick = (e) => {
    // Prevent event bubbling
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-4xl mx-auto">
        <StepIndicator currentStep="setup" role="vendor" />
        
        <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <h2 className="text-3xl font-bold text-bharat-primary">
                {t('vendorSetup')}
              </h2>
              <SpeakButton 
                text={t('vendorSetup')} 
                language={preSelectedLanguage || 'en'} 
                size="md"
              />
            </div>
            <p className="text-bharat-muted">
              {t('configureSellingSession')}
            </p>
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h3 className="text-xl font-semibold text-bharat-primary">
                {t('selectCategories')}
              </h3>
              <SpeakButton 
                text={t('selectCategories')} 
                language={preSelectedLanguage || 'en'} 
                size="sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategories.includes(category.key);
                
                return (
                  <div key={category.key} className="text-center">
                    <button
                      onClick={() => handleCategoryToggle(category.key)}
                      className={`
                        p-8 rounded-lg border-2 transition-all duration-200 w-full
                        ${isSelected
                          ? 'border-bharat-primary bg-bharat-primary bg-opacity-5 transform scale-105'
                          : 'border-bharat-border hover:border-bharat-primary'
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className={`
                          w-16 h-16 mx-auto mb-4 rounded-full
                          ${category.bgColor} flex items-center justify-center
                        `}>
                          <IconComponent className={`w-8 h-8 ${category.color}`} />
                        </div>
                        <div className="font-medium text-bharat-primary text-lg">
                          {category.label}
                        </div>
                      </div>
                    </button>
                    {/* SpeakButton moved outside button to fix DOM nesting */}
                    <div className="flex justify-center mt-2" onClick={handleSpeakClick}>
                      <SpeakButton 
                        text={category.label} 
                        language={preSelectedLanguage || 'en'} 
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-bharat-negotiation text-sm mt-4 text-center">
                {t('pleaseSelectCategoryToContinue')}
              </p>
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              disabled={selectedCategories.length === 0}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg
                font-medium transition-all duration-200
                ${selectedCategories.length > 0
                  ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                  : 'bg-bharat-border text-bharat-muted cursor-not-allowed'
                }
              `}
            >
              <span>{t('continue')}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSetup;