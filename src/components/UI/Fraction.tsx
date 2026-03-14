'use client';

import React from 'react';

interface FractionProps {
  value: string | number;
  className?: string;
  showMixedNumber?: boolean; // Опция для отображения смешанных чисел
}

/**
 * Компонент для красивого отображения математических дробей
 * Преобразует строку вида "3/4" в визуальную дробь с числителем над знаменателем
 * Поддерживает смешанные числа (например, 1½ вместо 3/2)
 */
export const Fraction: React.FC<FractionProps> = ({ value, className = '', showMixedNumber = false }) => {
  const valueStr = typeof value === 'number' ? value.toString() : value;
  
  // Проверяем, является ли значение дробью
  const fractionMatch = valueStr.match(/^(-?)(\d+)\/(\d+)$/);
  
  if (fractionMatch) {
    const [, sign, numeratorStr, denominatorStr] = fractionMatch;
    const numerator = parseInt(numeratorStr, 10);
    const denominator = parseInt(denominatorStr, 10);
    
    // Если включена опция смешанных чисел и числитель больше знаменателя
    if (showMixedNumber && numerator > denominator) {
      const wholePart = Math.floor(numerator / denominator);
      const remainder = numerator % denominator;
      
      if (remainder === 0) {
        // Если делится нацело, просто отображаем целое число
        return <span className={className}>{sign}{wholePart}</span>;
      }
      
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          {sign && <span>{sign}</span>}
          <span className="font-bold">{wholePart}</span>
          <span className="inline-flex flex-col items-center text-center leading-none">
            <span className="border-b border-current px-1 text-xs">{remainder}</span>
            <span className="px-1 text-xs">{denominator}</span>
          </span>
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center ${className}`}>
        {sign && <span className="mr-0.5">{sign}</span>}
        <span className="inline-flex flex-col items-center text-center leading-none">
          <span className="border-b border-current px-1">{numerator}</span>
          <span className="px-1">{denominator}</span>
        </span>
      </span>
    );
  }
  
  // Если это не дробь, просто отображаем значение
  return <span className={className}>{valueStr}</span>;
};

export default Fraction;

