import React from 'react';
import { Store, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SpeakButton from './common/SpeakButton';

const RoleSelector = ({ onRoleSelect }) => {
  const { t, i18n } = useTranslation();

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

  return (
    <div className="min-h-screen bg-bharat-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold text-bharat-primary">
              {t('welcome')}
            </h1>
            <SpeakButton 
              text={t('welcome')} 
              language={i18n.language} 
              size="md"
            />
          </div>
          <p className="text-bharat-muted text-lg">
            {t('selectRole')}
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <div
                key={role.key}
                onClick={() => onRoleSelect(role.key)}
                className={`
                  group cursor-pointer
                  bg-white rounded-xl shadow-lg border border-bharat-border
                  p-8 text-center transition-all duration-300
                  hover:shadow-xl hover:scale-105
                  ${role.hoverColor} hover:bg-opacity-5
                `}
              >
                <div className={`
                  w-20 h-20 mx-auto mb-6 rounded-full
                  ${role.color} bg-opacity-10
                  flex items-center justify-center
                  group-hover:bg-opacity-20 transition-all duration-300
                `}>
                  <IconComponent className={`w-10 h-10 text-bharat-primary`} />
                </div>
                
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <h3 className="text-2xl font-semibold text-bharat-primary">
                    {role.title}
                  </h3>
                  <SpeakButton 
                    text={role.title} 
                    language={i18n.language} 
                    size="sm"
                  />
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-bharat-muted">
                    {role.description}
                  </p>
                  <SpeakButton 
                    text={role.description} 
                    language={i18n.language} 
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Text */}
        <div className="mt-12 text-center">
          <p className="text-bharat-muted">
            You'll be able to select your preferred language in the next step
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;