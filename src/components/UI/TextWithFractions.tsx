'use client';

import React from 'react';
import { Fraction } from './Fraction';

interface TextWithFractionsProps {
  text: string;
  className?: string;
  showMixedNumbers?: boolean; // Опция для отображения смешанных чисел
}

/**
 * Компонент для отображения текста с автоматическим преобразованием дробей
 * Находит дроби в формате "число/число" и заменяет их на визуальные компоненты
 * Поддерживает смешанные числа
 */
export const TextWithFractions: React.FC<TextWithFractionsProps> = ({ 
  text, 
  className = '', 
  showMixedNumbers = false 
}) => {
  // Регулярное выражение для поиска дробей в тексте
  const fractionRegex = /(-?\d+)\/(\d+)/g;
  
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  // Находим все дроби в тексте
  while ((match = fractionRegex.exec(text)) !== null) {
    // Добавляем текст до дроби
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Добавляем визуальную дробь
    parts.push(
      <Fraction 
        key={`fraction-${key++}`} 
        value={match[0]} 
        className="mx-0.5" 
        showMixedNumber={showMixedNumbers}
      />
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return <span className={className}>{parts}</span>;
};

export default TextWithFractions;

