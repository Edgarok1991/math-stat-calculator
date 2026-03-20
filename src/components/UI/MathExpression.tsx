'use client';

import React from 'react';
import { TextWithFractions } from './TextWithFractions';
import { Sqrt } from './MathFormula';

interface MathExpressionProps {
  expression: string;
  className?: string;
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'x': 'ˣ', 'a': 'ᵃ', 'b': 'ᵇ', 'i': 'ⁱ',
};

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'n': 'ₙ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'x': 'ₓ',
};

function toSup(s: string): string {
  return s.split('').map((c) => SUPERSCRIPT[c] ?? c).join('');
}

function toSub(s: string): string {
  return s.split('').map((c) => SUBSCRIPT[c] ?? c).join('');
}

/**
 * Компонент для математического отображения выражений.
 * Преобразует: степени, дроби, корни, индексы, умножение.
 */
export const MathExpression: React.FC<MathExpressionProps> = ({ expression, className = '' }) => {
  let formatted = String(expression ?? '').trim();
  if (!formatted) return <span className={className} />;

  formatted = formatted.replace(/\bln\s*([a-z])\b/g, 'ln($1)');
  formatted = formatted.replace(/\blog\s*([a-z])\b/g, 'log($1)');
  formatted = formatted.replace(/exp\(([a-z])\)/g, 'e^$1');
  formatted = formatted.replace(/\*/g, '·');
  formatted = formatted.replace(/abs\(([^)]+)\)/g, '|$1|');
  formatted = formatted.replace(/log\(/g, 'ln(');

  // Степени ^n
  formatted = formatted.replace(/\^(\d+)/g, (_, p) => toSup(p));
  formatted = formatted.replace(/\^([a-z])/g, (_, v) => SUPERSCRIPT[v] ?? `^${v}`);
  formatted = formatted.replace(/\^\(([^)]+)\)/g, (_, inner) => toSup(inner));

  // Нижние индексы _n, _12, x_i
  formatted = formatted.replace(/([a-zA-Z])_(\d+)/g, (_, base, sub) => `${base}${toSub(sub)}`);
  formatted = formatted.replace(/([a-zA-Z])_([a-z])/g, (_, base, sub) => `${base}${SUBSCRIPT[sub] ?? sub}`);

  // sqrt(x) → √ с содержимым
  const sqrtRegex = /sqrt\(([^)]*)\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let m;
  let key = 0;

  while ((m = sqrtRegex.exec(formatted)) !== null) {
    if (m.index > lastIndex) {
      parts.push(formatted.substring(lastIndex, m.index));
    }
    parts.push(
      <Sqrt key={`sqrt-${key++}`}>
        <TextWithFractions text={m[1]} />
      </Sqrt>
    );
    lastIndex = m.index + m[0].length;
  }

  if (parts.length === 0) {
    return (
      <span className={className}>
        <TextWithFractions text={formatted} />
      </span>
    );
  }

  if (lastIndex < formatted.length) {
    parts.push(formatted.substring(lastIndex));
  }

  return (
    <span className={className}>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <TextWithFractions key={i} text={p} />
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </span>
  );
};

export default MathExpression;
