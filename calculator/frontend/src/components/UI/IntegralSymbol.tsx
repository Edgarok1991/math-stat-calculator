'use client';

import React from 'react';

interface IntegralSymbolProps {
  type: 'indefinite' | 'definite';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const IntegralSymbol: React.FC<IntegralSymbolProps> = ({ 
  type, 
  size = 'medium',
  className = '' 
}) => {
  const sizes = {
    small: {
      integral: 'text-lg',
      limits: 'text-[0.5rem]',
      spacing: '-mt-0.5 -mb-0.5',
    },
    medium: {
      integral: 'text-2xl',
      limits: 'text-[0.65rem]',
      spacing: '-mt-1 -mb-1',
    },
    large: {
      integral: 'text-3xl',
      limits: 'text-xs',
      spacing: '-mt-1.5 -mb-1.5',
    },
  };

  const sizeConfig = sizes[size];

  if (type === 'indefinite') {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <span className={sizeConfig.integral}>∫</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="relative inline-flex flex-col items-center justify-center">
        <span className={`${sizeConfig.limits} font-semibold ${sizeConfig.spacing}`}>b</span>
        <span className={sizeConfig.integral}>∫</span>
        <span className={`${sizeConfig.limits} font-semibold ${sizeConfig.spacing}`}>a</span>
      </span>
    </span>
  );
};

export default IntegralSymbol;
