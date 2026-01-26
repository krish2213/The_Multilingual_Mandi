import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StepIndicator = ({ currentStep, role }) => {
  const { t } = useTranslation();
  
  const steps = [
    { key: 'setup', label: t('setup') },
    { key: 'inventory', label: t('inventory') },
    { key: 'negotiation', label: t('negotiation') },
    { key: 'payment', label: t('payment') }
  ];

  const getStepIndex = (step) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-bharat-success border-bharat-success text-white' 
                      : isCurrent 
                        ? 'bg-bharat-primary border-bharat-primary text-white'
                        : 'bg-white border-bharat-border text-bharat-muted'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isCurrent 
                      ? 'text-bharat-primary' 
                      : isCompleted 
                        ? 'text-bharat-success'
                        : 'text-bharat-muted'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-16 h-0.5 transition-all duration-300
                    ${index < currentIndex 
                      ? 'bg-bharat-success' 
                      : 'bg-bharat-border'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;