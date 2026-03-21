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
import { MathExpression } from '@/components/UI/MathExpression';
import { calculateAnovaClient } from '@/lib/anovaClient';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const EXAMPLE_DATASETS: Record<string, string> = {
  Образование: '70, 72, 68, 75, 71\n78, 82, 80, 79, 81\n85, 88, 90, 87, 86',
  Медицина: '3.2, 3.5, 3.0, 3.8, 3.4\n4.5, 4.2, 4.8, 4.1, 4.6\n5.2, 5.5, 5.0, 5.8, 5.3',
  'С/х': '12, 14, 11, 13, 15\n18, 20, 17, 19, 21\n22, 24, 23, 21, 25',
  Маркетинг: '15, 17, 14, 16, 18\n22, 24, 21, 23, 25\n30, 32, 28, 31, 29',
};

const anovaSchema = z.object({
  groups: z.string().min(1, 'Введите данные групп'),
  alpha: z.number().min(0.01).max(0.1),
  decimals: z.number().min(2).max(9),
});

type AnovaFormData = z.infer<typeof anovaSchema>;

function AnovaPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<AnovaResult | null>(null);
  const [groupsData, setGroupsData] = useState<number[][]>([]);
  const [decimalsPreference, setDecimalsPreference] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  const anovaSteps = [
    {
      id: 'step1',
      title: 'Введите данные групп',
      description: 'Каждая группа на новой строке. Числа через запятую или пробел.',
      content: (
        <div className="space-y-2 text-sm">
          <p>• Минимум 2 группы, в каждой минимум 2 наблюдения</p>
          <p>• Используйте примеры: Образование, Медицина, С/х, Маркетинг</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Уровень значимости α',
      description: 'Обычно α = 0.05 (95% доверия).',
      content: (
        <div className="space-y-2 text-sm">
          <p>• 0.01 — строгий (99% доверия)</p>
          <p>• 0.05 — стандартный (95% доверия)</p>
          <p>• 0.10 — мягкий (90% доверия)</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Интерпретация',
      description: 'p &lt; α: различия значимы. η²: малый 0.01, средний 0.06, большой 0.14.',
      content: (
        <div className="space-y-2 text-sm">
          <p>• Полная таблица ANOVA: SS, df, MS, F</p>
          <p>• Размер эффекта: η² и ω²</p>
          <p>• Box plot для визуализации</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AnovaFormData>({
    resolver: zodResolver(anovaSchema),
    defaultValues: {
      alpha: 0.05,
      decimals: 4,
    },
  });

  const parseGroups = (str: string): number[][] => {
    return str
      .split(/[\n;]+/)
      .map((line) =>
        line
          .replace(/^[^:]*:\s*/, '')
          .split(/[,\s]+/)
          .map(Number)
          .filter((n) => !isNaN(n)),
      )
      .filter((group) => group.length > 0);
  };

  const onSubmit = async (data: AnovaFormData) => {
    setIsLoading(true);
    setResult(null);
    const groups = parseGroups(data.groups);
    if (groups.length < 2) {
      setIsLoading(false);
      alert('Необходимо минимум 2 группы');
      return;
    }
    setGroupsData(groups);
    setDecimalsPreference(data.decimals);

    try {
      const calcResult = calculateAnovaClient(groups, data.alpha);
      setResult(calcResult);
      calculatorStore.addCalculation({ type: 'anova', input: { groups, alpha: data.alpha }, result: calcResult });
      if (token) {
        apiService.saveToHistory(token, { type: 'anova', input: { groups, alpha: data.alpha }, result: calcResult }).catch(() => {});
      }
    } catch (err) {
      console.error('Ошибка ANOVA:', err);
      alert(err instanceof Error ? err.message : 'Ошибка при расчёте ANOVA');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVal = (val: number, decimals?: number) =>
    val.toFixed(decimals ?? decimalsPreference);

  const getEffectSizeLabel = (eta: number) => {
    if (eta < 0.01) return 'пренебрежимый';
    if (eta < 0.06) return 'малый';
    if (eta < 0.14) return 'средний';
    return 'большой';
  };

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/data-analysis" className="inline-flex items-center text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--foreground-secondary)' }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Назад к Анализу данных
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-xl shadow-lg p-6 sm:p-8 card-midnight">
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Калькулятор ANOVA</h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--foreground-secondary)' }}>
              Однофакторный дисперсионный анализ — полная таблица ANOVA, размер эффекта, визуализация
            </p>
            <div className="mt-4 flex justify-center">
              <StepGuide steps={anovaSteps} title="Как пользоваться" description="Пошаговое руководство" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Примеры */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>Примеры наборов данных:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(EXAMPLE_DATASETS).map(([name, data]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setValue('groups', data)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-tertiary)' }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground-secondary)' }}>
                  Введите данные групп (каждая группа — новая строка, числа через запятую или пробел)
                </label>
                <textarea
                  {...register('groups')}
                  className="w-full px-3 py-2 input-midnight rounded-md font-mono text-sm min-h-[120px]"
                  placeholder="15, 16, 14, 15, 17&#10;18, 19, 17, 18, 20&#10;22, 21, 23, 22, 24"
                />
                {errors.groups && <p className="mt-1 text-sm text-red-400">{errors.groups.message}</p>}
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground-secondary)' }}>Уровень значимости (α)</label>
                  <select {...register('alpha', { valueAsNumber: true })} className="px-3 py-2 input-midnight rounded-md">
                    <option value={0.01}>0.01 (99% доверия)</option>
                    <option value={0.05}>0.05 (95% доверия)</option>
                    <option value={0.1}>0.10 (90% доверия)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground-secondary)' }}>Точность десятичных</label>
                  <select {...register('decimals', { valueAsNumber: true })} className="px-3 py-2 input-midnight rounded-md">
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>{n} знаков</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" loading={isLoading} className="w-full sm:w-auto min-w-[200px]">
                {isLoading ? 'Вычисляем...' : 'Рассчитать ANOVA'}
              </Button>
            </form>
          </div>

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 space-y-8">
              {/* Полная таблица ANOVA */}
              <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="p-4 font-bold" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>
                  Таблица ANOVA
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--background-secondary)' }}>
                        <th className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--foreground)' }}>Источник</th>
                        <th className="px-4 py-2 text-right font-semibold">SS</th>
                        <th className="px-4 py-2 text-right font-semibold">df</th>
                        <th className="px-4 py-2 text-right font-semibold">MS</th>
                        <th className="px-4 py-2 text-right font-semibold">F</th>
                        <th className="px-4 py-2 text-right font-semibold">p</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2 font-medium">Между группами</td>
                        <td className="px-4 py-2 text-right font-mono">{result.ssb != null ? formatVal(result.ssb) : '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{result.dfBetween ?? '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{result.msb != null ? formatVal(result.msb) : '—'}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">{formatVal(result.fStatistic)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatVal(result.pValue, 6)}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2 font-medium">Внутри групп</td>
                        <td className="px-4 py-2 text-right font-mono">{result.ssw != null ? formatVal(result.ssw) : '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{result.dfWithin ?? '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{result.msw != null ? formatVal(result.msw) : '—'}</td>
                        <td className="px-4 py-2 text-right">—</td>
                        <td className="px-4 py-2 text-right">—</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2 font-medium">Общая</td>
                        <td className="px-4 py-2 text-right font-mono">{result.sst != null ? formatVal(result.sst) : '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{result.dfTotal ?? '—'}</td>
                        <td className="px-4 py-2 text-right">—</td>
                        <td className="px-4 py-2 text-right">—</td>
                        <td className="px-4 py-2 text-right">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Размер эффекта */}
              {result.etaSquared != null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Эта-квадрат (η²)</h4>
                    <p className="text-2xl font-bold font-mono mb-1">{result.etaSquared.toFixed(decimalsPreference)}</p>
                    <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                      Доля дисперсии, объясняемая группой. Размер эффекта: <strong>{getEffectSizeLabel(result.etaSquared)}</strong>
                    </p>
                  </div>
                  {result.omegaSquared != null && (
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
                      <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Омега-квадрат (ω²)</h4>
                      <p className="text-2xl font-bold font-mono mb-1">{result.omegaSquared.toFixed(decimalsPreference)}</p>
                      <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                        Смещённая оценка доли дисперсии в генеральной совокупности
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Статистическая значимость */}
              <div className={`p-4 rounded-lg border-2 ${result.significant ? 'border-green-500/50' : 'border-amber-500/50'}`} style={{ background: result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Проверка гипотез</h4>
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                  {result.significant ? (
                    <>p-значение ({formatVal(result.pValue, 6)}) &lt; α. <strong className="text-green-400">Отклонить H₀</strong>. По крайней мере одно среднее существенно отличается.</>
                  ) : (
                    <>p-значение ({formatVal(result.pValue, 6)}) ≥ α. <strong className="text-amber-400">Не отклонять H₀</strong>. Недостаточно доказательств различий между группами.</>
                  )}
                </p>
              </div>

              {/* Box Plot */}
              {result.groupMeans.length > 0 && groupsData.length > 0 && (
                <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="p-4 font-bold" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>
                    Визуализация — Box Plot по группам
                  </div>
                  <div className="p-4" style={{ background: 'var(--background)' }}>
                    {/* @ts-ignore */}
                    <Plot
                      data={groupsData.map((arr, i) => ({
                        y: arr,
                        x: arr.map(() => `Группа ${i + 1}`),
                        type: 'box' as const,
                        name: `Группа ${i + 1}`,
                        boxpoints: 'all' as const,
                        marker: { color: `hsl(${210 + i * 40}, 70%, 55%)` },
                        fillcolor: `hsla(${210 + i * 40}, 70%, 55%, 0.2)`,
                      }))}
                      layout={{
                        autosize: true,
                        height: 400,
                        yaxis: { title: 'Значения', gridcolor: 'rgba(212,175,55,0.2)' },
                        xaxis: { title: 'Группа' },
                        plot_bgcolor: 'transparent',
                        paper_bgcolor: 'transparent',
                        font: { color: 'var(--foreground)' },
                        margin: { t: 20, b: 50, l: 50, r: 20 },
                        showlegend: false,
                      }}
                      config={{ displayModeBar: true, displaylogo: false }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Статистика по группам */}
              <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="p-4 font-bold" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>
                  Статистика групп
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--background-secondary)' }}>
                        <th className="px-4 py-2 text-left font-semibold">Группа</th>
                        <th className="px-4 py-2 text-right font-semibold">n</th>
                        <th className="px-4 py-2 text-right font-semibold">Среднее</th>
                        <th className="px-4 py-2 text-right font-semibold">Стд. откл.</th>
                        <th className="px-4 py-2 text-right font-semibold">Дисперсия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.groupMeans.map((mean, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2 font-medium">Группа {i + 1}</td>
                          <td className="px-4 py-2 text-right font-mono">{result.groupSizes?.[i] ?? '—'}</td>
                          <td className="px-4 py-2 text-right font-mono">{mean.toFixed(decimalsPreference)}</td>
                          <td className="px-4 py-2 text-right font-mono">{result.groupStdDevs?.[i] != null ? result.groupStdDevs[i].toFixed(decimalsPreference) : '—'}</td>
                          <td className="px-4 py-2 text-right font-mono">{result.groupVariances[i].toFixed(decimalsPreference)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Пошаговое решение (свёрнутое по умолчанию или секция) */}
              {result.steps && result.steps.length > 0 && (
                <details className="rounded-lg border-2" style={{ borderColor: 'var(--border)' }}>
                  <summary className="p-4 font-bold cursor-pointer hover:opacity-90" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>
                    Пошаговое решение (нажмите, чтобы раскрыть)
                  </summary>
                  <div className="p-4 space-y-4" style={{ background: 'var(--background-secondary)' }}>
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--gold)', color: '#1c1917' }}>{step.step}</span>
                          <h4 className="font-semibold">{step.title}</h4>
                        </div>
                        {step.formula && <p className="text-sm font-mono mb-1"><MathExpression expression={step.formula} className="text-sm" /></p>}
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>{step.description}</p>
                        {step.value != null && <p className="mt-1 font-mono">{parseFloat(step.value).toFixed(decimalsPreference)}</p>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default observer(AnovaPage);
