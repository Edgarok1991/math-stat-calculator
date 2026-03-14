'use client';

import React from 'react';

interface MathFormulaProps {
  children: React.ReactNode;
  className?: string;
}

// Компонент для дроби
export const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode }> = ({ num, den }) => (
  <span className="inline-flex flex-col items-center justify-center text-center mx-1 relative" style={{ verticalAlign: 'middle' }}>
    <span className="border-b-2 border-current px-2 pb-1 leading-none text-[0.95em]">{num}</span>
    <span className="px-2 pt-1 leading-none text-[0.95em]">{den}</span>
  </span>
);

// Компонент для степени
export const Pow: React.FC<{ base: React.ReactNode; exp: React.ReactNode }> = ({ base, exp }) => {
  // Unicode символы для степеней (используем для красоты)
  const unicodeSuperscripts: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺', 'n': 'ⁿ', 'x': 'ˣ',
  };
  
  // Проверяем, является ли exp простым числом или строкой
  const isSimpleExp = typeof exp === 'string' || typeof exp === 'number';
  
  if (isSimpleExp) {
    // Пытаемся конвертировать в Unicode если это простое число или n
    const expStr = String(exp);
    let unicodeExp = '';
    let canUseUnicode = true;
    
    for (const char of expStr) {
      if (unicodeSuperscripts[char]) {
        unicodeExp += unicodeSuperscripts[char];
      } else if (char === ' ') {
        unicodeExp += ' ';
      } else {
        canUseUnicode = false;
        break;
      }
    }
    
    if (canUseUnicode && unicodeExp) {
      return (
        <span className="inline-flex items-baseline">
          <span className="leading-none">{base}</span>
          <span className="text-[1em] leading-none ml-[0.1em]">{unicodeExp}</span>
        </span>
      );
    }
  }
  
  // Fallback на <sup> для сложных выражений
  return (
    <span className="inline-flex items-baseline relative">
      <span className="leading-none">{base}</span>
      <sup className="text-[0.7em] ml-[0.15em] font-semibold" style={{ lineHeight: 0, position: 'relative', top: '-0.5em' }}>{exp}</sup>
    </span>
  );
};

// Компонент для корня с красивым символом
export const Sqrt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sqrt-wrapper">
    <span className="sqrt-symbol">√</span>
    <span className="sqrt-content">{children}</span>
  </span>
);

// Компонент для нижнего индекса
export const Sub: React.FC<{ base: React.ReactNode; subscript: React.ReactNode }> = ({ base, subscript }) => (
  <span className="inline-flex items-baseline relative">
    <span className="leading-none">{base}</span>
    <sub className="text-[0.75em] ml-[0.15em]" style={{ lineHeight: 0, position: 'relative', bottom: '-0.15em' }}>{subscript}</sub>
  </span>
);

// Обёртка для математической формулы
export const MathFormula: React.FC<MathFormulaProps> = ({ children, className = '' }) => (
  <span className={`font-mono inline-flex items-center ${className}`} style={{ whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

