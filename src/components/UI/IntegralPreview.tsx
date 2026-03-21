'use client';

import React from 'react';
import { MathExpression } from './MathExpression';

interface IntegralPreviewProps {
  expression: string;
  variable?: string;
  integralType?: 'indefinite' | 'definite';
  upperBound?: number;
  lowerBound?: number;
  className?: string;
}

/**
 * Превью интеграла при вводе — как на картинке:
 * ∫ с плейсхолдерами пределов, подынтегральное выражение, d[x] с подсветкой переменной
 */
export const IntegralPreview: React.FC<IntegralPreviewProps> = ({
  expression,
  variable = 'x',
  integralType = 'indefinite',
  upperBound,
  lowerBound,
  className = '',
}) => {
  const hasExpression = expression?.trim().length > 0;

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg min-h-[2.5rem] border-2 ${className}`}
      style={{
        background: 'var(--background-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Знак интеграла с пределами или плейсхолдерами */}
      <span className="relative inline-flex flex-col items-center justify-center flex-shrink-0">
        {/* Верхний предел или плейсхолдер */}
        <span
          className="text-[0.65rem] font-semibold -mb-1 min-w-[1.25rem] text-center"
          style={{
            color: integralType === 'definite' && upperBound != null
              ? 'var(--foreground)'
              : 'var(--foreground-secondary)',
          }}
        >
          {integralType === 'definite' && upperBound != null ? (
            String(upperBound)
          ) : (
            <span
              className="inline-block w-4 h-3 rounded border border-dashed"
              style={{ borderColor: 'var(--border)', opacity: 0.6 }}
              aria-hidden
            />
          )}
        </span>
        {/* Символ ∫ */}
        <span className="text-2xl font-serif" style={{ color: 'var(--foreground)' }}>
          ∫
        </span>
        {/* Нижний предел или плейсхолдер */}
        <span
          className="text-[0.65rem] font-semibold -mt-1 min-w-[1.25rem] text-center"
          style={{
            color: integralType === 'definite' && lowerBound != null
              ? 'var(--foreground)'
              : 'var(--foreground-secondary)',
          }}
        >
          {integralType === 'definite' && lowerBound != null ? (
            String(lowerBound)
          ) : (
            <span
              className="inline-block w-4 h-3 rounded border border-dashed"
              style={{ borderColor: 'var(--border)', opacity: 0.6 }}
              aria-hidden
            />
          )}
        </span>
      </span>

      {/* Подынтегральное выражение */}
      <span className="text-lg mx-2" style={{ color: 'var(--foreground)' }}>
        {hasExpression ? (
          <MathExpression expression={expression} />
        ) : (
          <span style={{ color: 'var(--foreground-secondary)', opacity: 0.5 }}>f(x)</span>
        )}
      </span>

      {/* Дифференциал d[переменная] — переменная в подсвеченном боксе */}
      <span className="flex items-center gap-1 flex-shrink-0">
        <span style={{ color: 'var(--foreground)' }}>d</span>
        <span
          className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded text-sm font-medium"
          style={{
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.4)',
            color: 'var(--foreground)',
          }}
        >
          {variable || 'x'}
        </span>
      </span>
    </div>
  );
};

export default IntegralPreview;
