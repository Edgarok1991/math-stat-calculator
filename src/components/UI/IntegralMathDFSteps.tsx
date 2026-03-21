'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MathExpression } from './MathExpression';

export interface IntegralStepStructured {
  actionLabel?: string;
  rule?: {
    name: string;
    formula?: string;
    substitutions?: { symbol: string; value: string }[];
  };
  expression?: string;
  expressionAfter?: string;
  subSteps?: Array<{ rule?: { name: string; formula?: string }; expression?: string }>;
}

interface IntegralMathDFStepsProps {
  steps: IntegralStepStructured[];
}

/**
 * Пошаговое решение интеграла в стиле MathDF (https://mathdf.com/int/ru/):
 * бейдж действия → выражение по центру → карточка правила с «Подробнее».
 * Цвета — тёмная тема приложения с золотыми акцентами.
 */
export function IntegralMathDFSteps({ steps }: IntegralMathDFStepsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 py-2">
      {steps.map((step, index) => (
        <MathDFStepBlock key={index} step={step} index={index} />
      ))}
    </div>
  );
}

function MathDFStepBlock({ step, index }: { step: IntegralStepStructured; index: number }) {
  const [detailsOpen, setDetailsOpen] = useState(index === 0);

  const hasRuleCard = Boolean(step.rule?.name);
  const subs = step.rule?.substitutions ?? [];
  /** Слева: u и dv (или f и g'); справа: du и v (или f' и g) — порядок в API: [0],[1],[2],[3] */
  const pairs =
    subs.length >= 4
      ? [
          [subs[0], subs[2]],
          [subs[1], subs[3]],
        ]
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col items-center gap-4 w-full"
    >
      {step.actionLabel && (
        <span
          className="inline-flex items-center rounded-full px-5 py-1.5 text-sm font-bold shadow-md"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #b8860b 100%)',
            color: '#1c1917',
            boxShadow: '0 2px 12px rgba(212, 175, 55, 0.35)',
          }}
        >
          {step.actionLabel.replace(/:$/, '')}
        </span>
      )}

      {step.expression && (
        <div
          className="w-full text-center px-4 py-3 rounded-xl text-lg md:text-xl leading-relaxed"
          style={{
            color: 'var(--foreground)',
            background: 'rgba(212, 175, 55, 0.06)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <MathExpression expression={step.expression} />
        </div>
      )}

      {hasRuleCard && step.rule && (
        <div
          className="w-full rounded-xl border-2 overflow-hidden"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.35)',
            background: 'var(--background-tertiary)',
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h4 className="font-semibold text-base md:text-lg" style={{ color: 'var(--foreground)' }}>
              {step.rule.name}
            </h4>
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              className="flex items-center gap-1 text-sm font-medium shrink-0 transition-opacity hover:opacity-90"
              style={{ color: 'var(--gold)' }}
            >
              Подробнее
              <ChevronDown
                className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {detailsOpen && (
            <div className="px-4 py-4 space-y-4">
              {step.rule.formula && (
                <div
                  className="text-center py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(212, 175, 55, 0.08)' }}
                >
                  <MathExpression expression={step.rule.formula} className="text-base md:text-lg" />
                </div>
              )}

              {pairs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  <div className="space-y-3 p-4 sm:border-r" style={{ borderColor: 'var(--border)' }}>
                    {pairs[0].map((s, i) => (
                      <SubstitutionRow key={`l${i}`} symbol={s.symbol} value={s.value} />
                    ))}
                  </div>
                  <div className="space-y-3 p-4 border-t sm:border-t-0" style={{ borderColor: 'var(--border)' }}>
                    {pairs[1].map((s, i) => (
                      <SubstitutionRow key={`r${i}`} symbol={s.symbol} value={s.value} />
                    ))}
                  </div>
                </div>
              ) : (
                subs.length > 0 && (
                  <div className="space-y-2">
                    {subs.map((s, i) => (
                      <SubstitutionRow key={i} symbol={s.symbol} value={s.value} />
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {step.expressionAfter && (
        <div
          className="w-full text-center px-4 py-3 rounded-xl text-base md:text-lg"
          style={{
            color: 'var(--foreground)',
            background: 'rgba(212, 175, 55, 0.04)',
            border: '1px dashed rgba(212, 175, 55, 0.25)',
          }}
        >
          <MathExpression expression={step.expressionAfter} />
        </div>
      )}

      {step.subSteps && step.subSteps.length > 0 && (
        <div className="w-full pl-3 sm:pl-6 border-l-2 space-y-4" style={{ borderColor: 'var(--gold)' }}>
          {step.subSteps.map((sub, j) => (
            <div
              key={j}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border)', background: 'rgba(212, 175, 55, 0.05)' }}
            >
              {sub.rule?.name && (
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>
                  {sub.rule.name}
                </p>
              )}
              {sub.rule?.formula && (
                <div className="mb-2 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                  <MathExpression expression={sub.rule.formula} />
                </div>
              )}
              {sub.expression && (
                <div className="text-center sm:text-left">
                  <MathExpression expression={sub.expression} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SubstitutionRow({ symbol, value }: { symbol: string; value: string }) {
  return (
    <p className="text-sm md:text-base flex flex-wrap items-baseline justify-center sm:justify-start gap-x-2 gap-y-1" style={{ color: 'var(--foreground-secondary)' }}>
      <span className="font-semibold tabular-nums" style={{ color: 'var(--gold)' }}>
        {symbol}
      </span>
      <span>=</span>
      <span className="min-w-0">
        <MathExpression expression={value} className="inline" />
      </span>
    </p>
  );
}
