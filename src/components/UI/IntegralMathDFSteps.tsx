'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MathExpression } from './MathExpression';
import { MathTex } from './MathTex';

export type IntegralStepKind =
  | 'default'
  | 'compute'
  | 'substitution'
  | 'backsubstitution'
  | 'rule'
  | 'line'
  | 'result';

export interface IntegralStepStructured {
  actionLabel?: string;
  stepKind?: IntegralStepKind;
  referenceTag?: string;
  expression?: string;
  expressionLatex?: string;
  rule?: {
    name: string;
    formula?: string;
    formulaLatex?: string;
    caseNote?: string;
    substitutions?: { symbol: string; value: string }[];
  };
  expressionAfter?: string;
  expressionAfterLatex?: string;
  subSteps?: IntegralStepStructured[];
}

interface IntegralMathDFStepsProps {
  steps: IntegralStepStructured[];
}

/** Рендер одной математической строки: LaTeX приоритетнее текстового MathExpression */
function StepMath({
  text,
  latex,
  display = false,
  className = '',
}: {
  text?: string;
  latex?: string;
  display?: boolean;
  className?: string;
}) {
  if (latex?.trim()) {
    return <MathTex latex={latex.trim()} display={display} className={className} />;
  }
  if (text?.trim()) {
    return <MathExpression expression={text} className={className} />;
  }
  return null;
}

/**
 * Пошаговое решение (структура как на MathDF, цвета — золотая тёмная тема приложения).
 */
export function IntegralMathDFSteps({ steps }: IntegralMathDFStepsProps) {
  return (
    <div
      className="w-full max-w-3xl mx-auto py-2 pl-3 sm:pl-5 border-l-2 space-y-6"
      style={{ borderColor: 'rgba(212, 175, 55, 0.35)' }}
    >
      {steps.map((step, index) => (
        <MathDFStepBlock key={index} step={step} index={index} />
      ))}
    </div>
  );
}

function inferKind(step: IntegralStepStructured): IntegralStepKind {
  if (step.stepKind) return step.stepKind;
  if (step.rule?.name && !step.expression && !step.expressionLatex) return 'rule';
  return 'default';
}

function MathDFStepBlock({
  step,
  index,
  nested = false,
}: {
  step: IntegralStepStructured;
  index: number;
  nested?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(
    nested ? true : inferKind(step) !== 'default'
  );

  const kind = inferKind(step);
  const subs = step.rule?.substitutions ?? [];
  const pairs =
    subs.length >= 4
      ? [
          [subs[0], subs[2]],
          [subs[1], subs[3]],
        ]
      : null;

  /** Подстановка / обратная замена — те же золотые акценты, что и остальной UI */
  const isGoldAccent = kind === 'substitution' || kind === 'backsubstitution';
  const isRule = kind === 'rule';
  const isLine = kind === 'line';
  const isCompute = kind === 'compute';

  if (isLine) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="w-full py-2 text-center text-lg md:text-xl"
        style={{ color: 'var(--foreground)' }}
      >
        <StepMath latex={step.expressionLatex} text={step.expression} display />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex flex-col gap-3 w-full ${nested ? 'items-stretch' : ''}`}
    >
      {step.actionLabel && (
        <div className="relative flex justify-center items-center gap-2 flex-wrap">
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
          {step.referenceTag && (
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--gold)' }}>
              {step.referenceTag}
            </span>
          )}
        </div>
      )}

      {!step.actionLabel && step.referenceTag && (
        <div className="flex justify-end">
          <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
            {step.referenceTag}
          </span>
        </div>
      )}

      {(step.expression || step.expressionLatex) && (
        <div
          className={`w-full text-center px-3 py-3 rounded-lg text-base md:text-lg leading-relaxed ${
            isGoldAccent ? 'border-2' : isCompute ? 'border' : 'border'
          }`}
          style={{
            color: 'var(--foreground)',
            background: isGoldAccent
              ? 'rgba(212, 175, 55, 0.1)'
              : isCompute
                ? 'rgba(212, 175, 55, 0.06)'
                : 'rgba(212, 175, 55, 0.04)',
            borderColor: isGoldAccent
              ? 'rgba(212, 175, 55, 0.45)'
              : isCompute
                ? 'rgba(212, 175, 55, 0.25)'
                : 'var(--border)',
          }}
        >
          <StepMath latex={step.expressionLatex} text={step.expression} display />
          {isGoldAccent && subs.length > 0 && (
            <div
              className="mt-4 pt-3 border-t space-y-2 text-left sm:text-center max-w-lg mx-auto"
              style={{ borderColor: 'rgba(212, 175, 55, 0.25)' }}
            >
              {subs.map((s, i) => (
                <SubstitutionRow key={i} symbol={s.symbol} value={s.value} />
              ))}
            </div>
          )}
        </div>
      )}

      {isRule && step.rule && (
        <div
          className="w-full rounded-lg border overflow-hidden"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.35)',
            background: 'var(--background-tertiary)',
          }}
        >
          <div
            className="px-3 py-2 border-b text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {step.rule.name}
          </div>
          <div className="px-3 py-3 space-y-2">
            {step.rule.formulaLatex && (
              <div className="text-center py-1">
                <MathTex latex={step.rule.formulaLatex} display />
              </div>
            )}
            {!step.rule.formulaLatex && step.rule.formula && (
              <div className="text-center py-1">
                <MathExpression expression={step.rule.formula} className="text-base md:text-lg" />
              </div>
            )}
            {step.rule.caseNote && (
              <p className="text-center text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                {step.rule.caseNote}
              </p>
            )}
          </div>
        </div>
      )}

      {!isRule && hasRuleCard(step) && step.rule && (
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
              {step.rule.formulaLatex && (
                <div
                  className="text-center py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(212, 175, 55, 0.08)' }}
                >
                  <MathTex latex={step.rule.formulaLatex} display />
                </div>
              )}
              {!step.rule.formulaLatex && step.rule.formula && (
                <div
                  className="text-center py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(212, 175, 55, 0.08)' }}
                >
                  <MathExpression expression={step.rule.formula} className="text-base md:text-lg" />
                </div>
              )}

              {pairs ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-lg overflow-hidden border"
                  style={{ borderColor: 'var(--border)' }}
                >
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

      {(step.expressionAfter || step.expressionAfterLatex) && (
        <div
          className="w-full text-center px-3 py-3 rounded-lg text-base md:text-lg leading-relaxed border"
          style={{
            color: 'var(--foreground)',
            background: isGoldAccent ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.04)',
            borderColor: isGoldAccent ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.2)',
          }}
        >
          <StepMath latex={step.expressionAfterLatex} text={step.expressionAfter} display />
        </div>
      )}

      {step.subSteps && step.subSteps.length > 0 && (
        <div className="w-full pl-3 sm:pl-4 border-l-2 space-y-6" style={{ borderColor: 'rgba(212, 175, 55, 0.35)' }}>
          {step.subSteps.map((sub, j) =>
            sub.actionLabel || sub.expressionAfter || sub.rule?.name ? (
              <MathDFStepBlock key={j} step={sub} index={j} nested />
            ) : (
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
                {sub.rule?.formulaLatex && (
                  <div className="mb-2 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    <MathTex latex={sub.rule.formulaLatex} display />
                  </div>
                )}
                {sub.rule?.formula && !sub.rule?.formulaLatex && (
                  <div className="mb-2 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    <MathExpression expression={sub.rule.formula!} />
                  </div>
                )}
                {sub.expression && (
                  <div className="text-center sm:text-left">
                    <MathExpression expression={sub.expression} />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}

function hasRuleCard(step: IntegralStepStructured): boolean {
  const k = step.stepKind ?? 'default';
  if (k === 'rule') return false;
  if (k === 'substitution' || k === 'backsubstitution') return false;
  return Boolean(step.rule?.name);
}

function SubstitutionRow({ symbol, value }: { symbol: string; value: string }) {
  return (
    <p
      className="text-sm md:text-base flex flex-wrap items-baseline justify-center sm:justify-start gap-x-2 gap-y-1"
      style={{ color: 'var(--foreground-secondary)' }}
    >
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
