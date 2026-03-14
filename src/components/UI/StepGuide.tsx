'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface Step {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

interface StepGuideProps {
  steps: Step[];
  title: string;
  description: string;
}

export const StepGuide = ({ steps, title, description }: StepGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
        Инструкция
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
              style={{ 
                background: 'var(--background-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {title}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--foreground-secondary)' }}>
                    {description}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Шаг {currentStep + 1} из {steps.length}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2" style={{ background: 'var(--background-tertiary)' }}>
                  <motion.div
                    className="h-2 rounded-full gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-base mb-4" style={{ color: 'var(--foreground-secondary)' }}>
                    {steps[currentStep].description}
                  </p>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--background-tertiary)' }}>
                    {steps[currentStep].content}
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>

                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentStep
                          ? 'gradient-primary'
                          : index < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Готово
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Далее
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};