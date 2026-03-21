'use client';

import React from 'react';
import { Fraction } from './Fraction';

const SUP_MARKER = '\uFFFF';

interface TextWithFractionsProps {
  text: string;
  className?: string;
  showMixedNumbers?: boolean; // Опция для отображения смешанных чисел
}

/** Оборачивает содержимое между маркерами степени в <sup> */
function withSup(text: string, showMixedNumbers: boolean, keyBase: number): React.ReactNode {
  if (!text.includes(SUP_MARKER)) return null;
  const parts = text.split(SUP_MARKER);
  const result: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      if (i % 2 === 0) {
        result.push(<TextWithFractions key={`${keyBase}-${i}`} text={parts[i]} showMixedNumbers={showMixedNumbers} />);
      } else {
        result.push(
          <sup key={`${keyBase}-${i}`} className="align-baseline text-[0.85em]" style={{ verticalAlign: 'super', lineHeight: 0 }}>
            <TextWithFractions text={parts[i]} showMixedNumbers={showMixedNumbers} />
          </sup>
        );
      }
    }
  }
  return result;
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
function renderText(text: string, showMixedNumbers: boolean, keyBase: number): React.ReactNode {
  if (text.includes(SUP_MARKER)) {
    return withSup(text, showMixedNumbers, keyBase);
  }
  return <TextWithFractions text={text} showMixedNumbers={showMixedNumbers} />;
}

export const TextWithFractions: React.FC<TextWithFractionsProps> = ({ 
  text, 
  className = '', 
  showMixedNumbers = false 
}) => {
  const result: (string | React.ReactElement)[] = [];
  let key = 0;
  let lastEnd = 0;

  // Дроби (a)/(b): если знаменатель в скобках — берём целиком (x²+1)/(x+3), не обрезая на «+» внутри (x+3)
  // Иначе (a)/x, (a)/2 — знаменатель без скобок (одно «слагаемое» из букв/цифр/индексов)
  const parenFrac =
    /\(([^)]+)\)\s*\/\s*(?:\(([^)]+)\)|([a-zA-Z0-9²³⁴⁵⁶⁷⁸⁹⁰¹]+))/g;
  let m;
  while ((m = parenFrac.exec(text)) !== null) {
    if (m.index > lastEnd) {
      const before = text.substring(lastEnd, m.index);
      result.push(<TextWithFractions key={`b${key++}`} text={before} showMixedNumbers={showMixedNumbers} />);
    }
    const denRaw = (m[2] ?? m[3] ?? '').trim();
    result.push(
      <FractionLayout
        key={`vf${key++}`}
        num={<TextWithFractions text={m[1]} showMixedNumbers={showMixedNumbers} />}
        den={<TextWithFractions text={denRaw} showMixedNumbers={showMixedNumbers} />}
      />
    );
    lastEnd = m.index + m[0].length;
  }

  let rest = lastEnd > 0 ? text.substring(lastEnd) : text;

  // Дроби вида expr/число (не чисто числовые) — e⁴·ˣ²⁺²/8, exp(x)/2
  const exprNumFrac = /(?!\d)[^/]+\/(\d+)(?=[+\-\s,]|$)/g;
  let restParts: (string | React.ReactElement)[] = [];
  let restLastEnd = 0;
  while ((m = exprNumFrac.exec(rest)) !== null) {
    if (m.index > restLastEnd) {
      restParts.push(rest.substring(restLastEnd, m.index));
    }
    const fullMatch = m[0];
    const numMatch = fullMatch.match(/(.*)\/(\d+)$/);
    if (numMatch) {
      restParts.push(
        <FractionLayout
          key={`ef${key++}`}
          num={renderText(numMatch[1], showMixedNumbers, key)}
          den={<>{numMatch[2]}</>}
        />
      );
    }
    restLastEnd = m.index + fullMatch.length;
  }
  if (restParts.length > 0) {
    if (restLastEnd < rest.length) restParts.push(rest.substring(restLastEnd));
  } else {
    // Числовые дроби (-?\d+)/(\d+)
    const numFrac = /(-?\d+)\/(\d+)/g;
    restLastEnd = 0;
    while ((m = numFrac.exec(rest)) !== null) {
      if (m.index > restLastEnd) {
        restParts.push(rest.substring(restLastEnd, m.index));
      }
      restParts.push(
        <Fraction key={`f${key++}`} value={m[0]} className="mx-0.5" showMixedNumber={showMixedNumbers} />
      );
      restLastEnd = m.index + m[0].length;
    }
    if (restLastEnd < rest.length) {
      restParts.push(rest.substring(restLastEnd));
    }
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

