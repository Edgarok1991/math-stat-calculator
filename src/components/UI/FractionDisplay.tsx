'use client';

import React from 'react';
import { Fraction } from './Fraction';
import { decimalToFraction } from '@/lib/decimalToFraction';

interface FractionDisplayProps {
  value: number | string;
  className?: string;
  showMixedNumber?: boolean;
  decimals?: number;
}

/**
 * Отображает число как дробь везде, где возможно.
 * Используется по всему приложению вместо toFixed.
 */
export const FractionDisplay: React.FC<FractionDisplayProps> = ({
  value,
  className = '',
  showMixedNumber = false,
  decimals = 4,
}) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const str = typeof value === 'string' && value.includes('/') ? value : decimalToFraction(num, decimals);
  return <Fraction value={str} className={className} showMixedNumber={showMixedNumber} />;
};

export default FractionDisplay;
