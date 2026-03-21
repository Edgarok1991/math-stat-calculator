'use client';

import React from 'react';
import { Fraction } from './Fraction';

interface TextWithFractionsProps {
  text: string;
  className?: string;
  showMixedNumbers?: boolean; // Опция для отображения смешанных чисел
}

/**
 * Визуальная дробь для выражений (числитель/знаменатель)
 */
function FractionLayout({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center justify-center mx-0.5 align-middle">
      <span className="border-b border-current px-0.5 text-center leading-tight">{num}</span>
      <span className="px-0.5 text-center leading-tight text-[0.95em]">{den}</span>
    </span>
  );
}

/**
 * Компонент для отображения текста с дробями.
 * Поддерживает: (expr)/(expr) и число/число
 */
export const TextWithFractions: React.FC<TextWithFractionsProps> = ({ 
  text, 
  className = '', 
  showMixedNumbers = false 
}) => {
  const result: (string | React.ReactElement)[] = [];
  let key = 0;
  let lastEnd = 0;

  // Дроби вида (a)/(b) — (4x²+2)/x или (x+1)/(x-1)
  const parenFrac = /\(([^)]+)\)\/([^/]+?)(?=[+\-\s,]|$)/g;
  let m;
  while ((m = parenFrac.exec(text)) !== null) {
    if (m.index > lastEnd) {
      const before = text.substring(lastEnd, m.index);
      result.push(<TextWithFractions key={`b${key++}`} text={before} showMixedNumbers={showMixedNumbers} />);
    }
    result.push(
      <FractionLayout
        key={`vf${key++}`}
        num={<TextWithFractions text={m[1]} showMixedNumbers={showMixedNumbers} />}
        den={<TextWithFractions text={m[2].trim()} showMixedNumbers={showMixedNumbers} />}
      />
    );
    lastEnd = m.index + m[0].length;
  }

  let rest = lastEnd > 0 ? text.substring(lastEnd) : text;

  // Числовые дроби (-?\d+)/(\d+)
  const numFrac = /(-?\d+)\/(\d+)/g;
  lastEnd = 0;
  const restParts: (string | React.ReactElement)[] = [];
  while ((m = numFrac.exec(rest)) !== null) {
    if (m.index > lastEnd) {
      restParts.push(rest.substring(lastEnd, m.index));
    }
    restParts.push(
      <Fraction key={`f${key++}`} value={m[0]} className="mx-0.5" showMixedNumber={showMixedNumbers} />
    );
    lastEnd = m.index + m[0].length;
  }

  if (lastEnd < rest.length) {
    restParts.push(rest.substring(lastEnd));
  }

  if (result.length > 0) {
    result.push(...restParts);
    return <span className={className}>{result}</span>;
  }

  if (restParts.length > 0) {
    return <span className={className}>{restParts}</span>;
  }

  return <span className={className}>{text}</span>;
};

export default TextWithFractions;

