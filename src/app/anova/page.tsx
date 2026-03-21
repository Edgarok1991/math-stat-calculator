'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { AnovaData, AnovaResult, AnovaStep } from '@/types/calculator';
import { calculatorStore } from '@/stores/CalculatorStore';
import { observer } from 'mobx-react-lite';
import { StepGuide } from '@/components/UI/StepGuide';
import { FractionDisplay } from '@/components/UI';
import { MathExpression } from '@/components/UI/MathExpression';
import { apiService } from '@/services/api';
import Link from 'next/link';

const anovaSchema = z.object({
  groups: z.string().min(1, 'Введите данные групп'),
  alpha: z.number().min(0.01).max(0.1),
  type: z.enum(['one-factor', 'multi-factor']),
});

type AnovaFormData = z.infer<typeof anovaSchema>;

function AnovaPage() {
  const [result, setResult] = useState<AnovaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const anovaSteps = [
    {
      id: 'step1',
      title: 'Подготовка данных групп',
      description: 'Введите данные для каждой группы.',
      content: (
        <div className="space-y-2">
          <p>• Формат: каждая группа на новой строке, числа через запятую</p>
          <p>• Минимум 2 группы, в каждой минимум 2 наблюдения</p>
          <p>• Однофакторный: одна переменная группировки</p>
          <p>• Многофакторный: расширенный анализ (в разработке)</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Выбор типа ANOVA',
      description: 'Однофакторный — F-критерий MSb/MSw. Многофакторный — факторные планы.',
      content: (
        <div className="space-y-2">
          <p>• <strong>Однофакторный:</strong> одна независимая переменная, F = MSb/MSw</p>
          <p>• <strong>Многофакторный:</strong> два и более факторов, взаимодействия</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Уровень значимости α',
      description: 'Обычно α = 0.05 (5%).',
      content: (
        <div className="space-y-2">
          <p>• α = 0.01 — строгий</p>
          <p>• α = 0.05 — стандартный</p>
          <p>• α = 0.1 — мягкий</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnovaFormData>({
    resolver: zodResolver(anovaSchema),
    defaultValues: {
      alpha: 0.05,
      type: 'one-factor',
    },
  });

  const parseGroups = (str: string): number[][] => {
    return str
      .split(/[\n;]+/)
      .map((line) =>
        line
          .replace(/^[^:]*:\s*/, '') // убираем "Группа1: "
          .split(/[,\s]+/)
          .map(Number)
          .filter((n) => !isNaN(n)),
      )
      .filter((group) => group.length > 0);
  };

  const onSubmit = async (data: AnovaFormData) => {
    setIsLoading(true);
    setResult(null);
    try {
      const groups = parseGroups(data.groups);

      if (groups.length < 2) {
        throw new Error('Необходимо минимум 2 группы');
      }

      const anovaData: AnovaData = {
        groups,
        alpha: data.alpha,
        type: data.type,
      };

      const apiResult = await apiService.calculateAnova(anovaData);
      setResult(apiResult);
      calculatorStore.addCalculation({
        type: 'anova',
        input: anovaData,
        result: apiResult,
      });
    } catch (error) {
      console.error('Ошибка ANOVA:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при расчёте ANOVA');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepValues = (step: AnovaStep) => {
    if (!step.values) return null;
    const entries = Object.entries(step.values).filter(
      ([k]) => !['formula'].includes(k),
    );
    if (entries.length === 0) return null;
    return (
      <div className="mt-3 p-3 rounded-lg border" style={{ background: 'var(--background-tertiary)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {entries.map(([key, val]) => (
            <div key={key} className="flex justify-between gap-2">
              <span style={{ color: 'var(--foreground-secondary)' }}>{key}:</span>
              <span className="font-mono">
                {typeof val === 'number' ? (
                  <FractionDisplay value={val} className="inline" decimals={4} />
                ) : typeof val === 'boolean' ? (
                  val ? 'да' : 'нет'
                ) : (
                  String(val)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/data-analysis"
            className="inline-flex items-center text-sm hover:text-[#E8C547] transition-colors"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад к Анализу данных
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="rounded-xl shadow-lg p-8 card-midnight"
        >
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                Дисперсионный анализ (ANOVA)
              </h1>
              <StepGuide
                steps={anovaSteps}
                title="Инструкция по ANOVA"
                description="Пошаговое руководство по дисперсионному анализу"
              />
            </div>
            <p className="text-center" style={{ color: 'var(--foreground-secondary)' }}>
              Сравнение средних через F-критерий: MSb и MSw
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                    Тип ANOVA
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 input-midnight rounded-md"
                  >
                    <option value="one-factor">Однофакторный (одна переменная, F = MSb/MSw)</option>
                    <option value="multi-factor">Многофакторный (факторные планы)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                    Данные групп (каждая группа на новой строке)
                  </label>
                  <textarea
                    {...register('groups')}
                    className="w-full px-3 py-2 input-midnight rounded-md font-mono text-sm"
                    rows={6}
                    placeholder="15, 16, 14, 15, 17&#10;18, 19, 17, 18, 20&#10;22, 21, 23, 22, 24"
                  />
                  {errors.groups && (
                    <p className="mt-1 text-sm text-red-400">{errors.groups.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                    Уровень значимости (α)
                  </label>
                  <select
                    {...register('alpha', { valueAsNumber: true })}
                    className="w-full px-3 py-2 input-midnight rounded-md"
                  >
                    <option value={0.01}>0.01 (1%)</option>
                    <option value={0.05}>0.05 (5%)</option>
                    <option value={0.1}>0.1 (10%)</option>
                  </select>
                </div>

                <Button type="submit" loading={isLoading} className="w-full">
                  {isLoading ? 'Вычисляем...' : 'Выполнить ANOVA'}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              {result && (
                <>
                  {/* Сводка */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg p-6"
                    style={{ background: 'var(--background-tertiary)' }}
                  >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                      Результаты {result.type === 'one-factor' ? 'однофакторного' : ''} ANOVA
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>F-статистика:</span>
                        <p className="text-lg font-mono">
                          <FractionDisplay value={result.fStatistic} />
                        </p>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>p-значение:</span>
                        <p className="text-lg font-mono">
                          <FractionDisplay value={result.pValue} decimals={6} />
                        </p>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Fкрит (α):</span>
                        <p className="text-lg font-mono">
                          <FractionDisplay value={result.criticalValue} />
                        </p>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Вывод:</span>
                        <p className={`text-lg font-semibold ${result.significant ? 'text-green-400' : 'text-amber-400'}`}>
                          {result.significant ? 'H₀ отклоняется — различия значимы' : 'H₀ не отклоняется — различия не значимы'}
                        </p>
                      </div>
                    </div>
                    {result.msb != null && result.msw != null && (
                      <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: 'var(--gold)', background: 'rgba(212,175,55,0.08)' }}>
                        <p className="text-sm font-medium">
                          MSb = <FractionDisplay value={result.msb} className="inline" /> &nbsp;|&nbsp;
                          MSw = <FractionDisplay value={result.msw} className="inline" /> &nbsp;→&nbsp;
                          F = MSb/MSw = <FractionDisplay value={result.fStatistic} className="inline" />
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Пошаговое решение */}
                  {result.steps && result.steps.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold" style={{ color: 'var(--gold)' }}>
                        Пошаговое решение
                      </h3>
                      {result.steps.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="rounded-lg border-2 p-4"
                          style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ background: 'var(--gold)', color: '#1c1917' }}
                            >
                              {step.step}
                            </span>
                            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {step.title}
                            </h4>
                          </div>
                          {step.formula && (
                            <p className="text-sm font-mono mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                              <MathExpression expression={step.formula} className="text-sm" />
                            </p>
                          )}
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                            {step.description}
                          </p>
                          {step.value != null && (
                            <p className="mt-2 font-mono font-semibold">
                              = <FractionDisplay value={parseFloat(step.value)} />
                            </p>
                          )}
                          {renderStepValues(step)}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Средние и дисперсии по группам */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-lg p-4"
                    style={{ background: 'var(--background-tertiary)' }}
                  >
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                      Средние и дисперсии по группам
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.groupMeans.map((mean, i) => (
                        <div
                          key={i}
                          className="p-2 rounded border text-sm"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <span className="font-medium">Группа {i + 1}:</span>{' '}
                          x̄ = <FractionDisplay value={mean} className="inline" />,
                          s² = <FractionDisplay value={result.groupVariances[i]} className="inline" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default observer(AnovaPage);
