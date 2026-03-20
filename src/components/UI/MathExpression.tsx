'use client';

import React from 'react';
import { TextWithFractions } from './TextWithFractions';

interface MathExpressionProps {
  expression: string;
  className?: string;
}

/**
 * Компонент для математического отображения выражений
 * Преобразует:
 * - x^2 → x²
 * - x^3 → x³
 * - * → ·
 * - 1/3 → вертикальная дробь
 * - exp(x) → eˣ
 */
export const MathExpression: React.FC<MathExpressionProps> = ({ expression, className = '' }) => {
  const superscriptMap: { [key: string]: string } = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
    '-': '⁻',
    '+': '⁺',
    '(': '⁽',
    ')': '⁾',
  };

  let formatted = expression;

  // lnx, ln x → ln(x) для отображения
  formatted = formatted.replace(/\bln\s*([a-z])\b/g, 'ln($1)');
  formatted = formatted.replace(/\blog\s*([a-z])\b/g, 'log($1)');
  // Преобразуем exp(x) в eˣ для простых случаев
  formatted = formatted.replace(/exp\(([a-z])\)/g, 'e^$1');

  // Преобразуем степени ^n в верхние индексы
  formatted = formatted.replace(/\^(\d+)/g, (match, power) => {
    return power.split('').map((digit: string) => superscriptMap[digit] || digit).join('');
  });

  // Преобразуем ^(выражение) в верхние индексы для переменных
  formatted = formatted.replace(/\^([a-z])/g, (match, variable) => {
    return superscriptMap[variable] || `^${variable}`;
  });

  // Заменяем * на точку умножения (кроме случаев внутри дробей)
  formatted = formatted.replace(/\*/g, '·');

  // Заменяем abs() на |x|
  formatted = formatted.replace(/abs\(([^)]+)\)/g, '|$1|');

  // Заменяем log() на ln()
  formatted = formatted.replace(/log\(/g, 'ln(');

  // Используем TextWithFractions для обработки дробей
  return (
    <span className={className}>
      <TextWithFractions text={formatted} />
    </span>
  );
};

export default MathExpression;
