'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { apiService } from '@/services/api';
import { StepGuide } from '@/components/UI/StepGuide';
import { InteractiveHint } from '@/components/UI/InteractiveHint';
import { AnimatedResult } from '@/components/UI/AnimatedResult';
import { BarChart3, TrendingUp, Calculator, PieChart } from 'lucide-react';

const statisticsSchema = z.object({
  data: z.string().min(1, 'Введите данные'),
});

type StatisticsFormData = z.infer<typeof statisticsSchema>;

interface HistogramBin {
  range: [number, number];
  count: number;
  frequency: number;
}

interface DescriptiveStatisticsResult {
  mean: number;
  median: number;
  mode: number[];
  range: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
  sum: number;
  outliers: number[];
  lowerFence: number;
  upperFence: number;
  histogram: HistogramBin[];
  sortedData: number[];
}

function StatisticsPage() {
  const [result, setResult] = useState<DescriptiveStatisticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statisticsSteps = [
    {
      id: 'step1',
      title: 'Подготовка данных',
      description: 'Введите числовые данные для анализа.',
      content: (
        <div className="space-y-2">
          <p>• Формат: числа через запятую (например: 12, 15, 18, 20, 22, 25)</p>
          <p>• Минимум 2 значения для расчета статистики</p>
          <p>• Используйте десятичные числа при необходимости</p>
          <p>• Повторяющиеся значения учитываются при расчете моды</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Описательная статистика',
      description: 'Получите подробный анализ ваших данных.',
      content: (
        <div className="space-y-2">
          <p>• <strong>Среднее:</strong> сумма всех значений, деленная на их количество</p>
          <p>• <strong>Медиана:</strong> центральное значение упорядоченного ряда</p>
          <p>• <strong>Мода:</strong> наиболее часто встречающееся значение</p>
          <p>• <strong>Размах:</strong> разница между max и min</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Квартили и дисперсия',
      description: 'Анализ разброса и распределения данных.',
      content: (
        <div className="space-y-2">
          <p>• <strong>Q1:</strong> первый квартиль (25-й процентиль)</p>
          <p>• <strong>Q3:</strong> третий квартиль (75-й процентиль)</p>
          <p>• <strong>IQR:</strong> межквартильный размах (Q3 - Q1)</p>
          <p>• <strong>Дисперсия:</strong> средний квадрат отклонений от среднего</p>
          <p>• <strong>Стд. отклонение:</strong> корень из дисперсии</p>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Интерпретация результатов',
      description: 'Используйте статистику для принятия решений.',
      content: (
        <div className="space-y-2">
          <p>• Сравнивайте среднее и медиану для оценки асимметрии</p>
          <p>• Анализируйте стандартное отклонение для оценки разброса</p>
          <p>• Используйте квартили для выявления выбросов</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatisticsFormData>({
    resolver: zodResolver(statisticsSchema),
  });

  const parseData = (str: string): number[] => {
    return str.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  };

  const onSubmit = async (data: StatisticsFormData) => {
    setIsLoading(true);
    try {
      const numericData = parseData(data.data);
      
      if (numericData.length < 2) {
        throw new Error('Необходимо минимум 2 значения');
      }

      const response = await apiService.calculateDescriptiveStatistics(numericData);
      setResult(response);
    } catch (error) {
      console.error('Error calculating statistics:', error);
      alert('Ошибка при расчете статистики');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(4);
  };

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <BarChart3 className="w-12 h-12" style={{ color: 'var(--gold)' }} />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--foreground)' }}>
                Описательная статистика
              </h1>
            </div>
            <p className="text-xl" style={{ color: 'var(--foreground-secondary)' }}>
              Рассчитайте основные статистические показатели ваших данных
            </p>
          </div>

          {/* Форма ввода */}
          <div className="mb-12 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl border-2 shadow-lg" 
              style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Calculator className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  Ввод данных
                </h2>
                <StepGuide 
                  steps={statisticsSteps}
                  title="Как рассчитать статистику?"
                  description="Следуйте этим шагам для анализа ваших данных"
                />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <InteractiveHint 
                    title="Данные для анализа"
                    content="Введите числовые данные, разделенные запятыми"
                    type="info"
                  >
                    <label htmlFor="data" className="block text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                       Данные для анализа
                    </label>
                  </InteractiveHint>
                  
                  <textarea
                    id="data"
                    {...register('data')}
                    className="w-full px-4 py-3 rounded-lg border-2 text-base transition-all input-midnight"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                    placeholder="12, 15, 18, 20, 22, 25, 28"
                    rows={3}
                  />
                  {errors.data && (
                    <p className="mt-1 text-sm text-red-400">{errors.data.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  loading={isLoading} 
                  disabled={isLoading}
                  className="w-full h-11 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-white"
                >
                  {isLoading ? '⏳ Рассчитываем...' : '🧮 Рассчитать статистику'}
                </Button>
              </form>

              {/* Разделитель */}
              <div className="border-t-2 my-6" style={{ borderColor: 'var(--border)' }}></div>

              {/* О статистике - внутри того же блока */}
              <div>
                {/* Заголовок и описание */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <PieChart className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    О статистике
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                    Описательная статистика — это набор методов для обобщения и представления данных в понятной форме
                  </p>
                </div>

                {/* Сетка информационных блоков */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Меры центральной тенденции */}
                <div className="p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
                  <h4 className="font-bold mb-2 text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    📊 Меры центральной тенденции
                  </h4>
                  <div className="space-y-2 text-sm">
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Среднее (Mean):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Сумма всех значений, деленная на их количество. Показывает "центр масс" данных. 
                    Чувствительно к выбросам.</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Медиана (Median):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Значение, которое делит упорядоченный набор данных пополам. 
                    Более устойчива к выбросам, чем среднее. Q2 = Медиана.</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Мода (Mode):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Наиболее часто встречающееся значение в данных. 
                    Может быть несколько мод (бимодальное, мультимодальное распределение).</p>
                  </div>
                  </div>
                </div>

                {/* Меры разброса */}
                <div className="p-4 rounded-xl border-2 border-green-500/50 bg-green-900/20 shadow-lg hover:shadow-xl transition-shadow">
                  <h4 className="font-bold text-green-300 mb-2 text-base flex items-center gap-2">
                    📏 Меры разброса (вариации)
                  </h4>
                  <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-green-300">Размах (Range):</strong>
                    <p className="ml-4 mt-1 text-green-200/90">Разница между максимальным и минимальным значением. 
                    Простейшая мера разброса, но очень чувствительна к выбросам.</p>
                  </div>
                  <div>
                    <strong className="text-green-300">Дисперсия (Variance):</strong>
                    <p className="ml-4 mt-1 text-green-200/90">Среднее квадратов отклонений от среднего значения. 
                    Показывает, насколько данные "разбросаны" относительно среднего. Измеряется в квадратах единиц.</p>
                  </div>
                  <div>
                    <strong className="text-green-300">Стандартное отклонение (Std Dev):</strong>
                    <p className="ml-4 mt-1 text-green-200/90">Квадратный корень из дисперсии. 
                    Показывает типичное отклонение от среднего в исходных единицах измерения. 
                    ~68% данных находится в пределах ±1σ от среднего (для нормального распределения).</p>
                  </div>
                  </div>
                </div>

                {/* Квартили и IQR */}
                <div className="p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ background: 'rgba(212,175,55,0.08)', borderColor: 'var(--border)' }}>
                  <h4 className="font-bold mb-2 text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    📦 Квартили и межквартильный размах
                  </h4>
                  <div className="space-y-2 text-sm">
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Q1 (Первый квартиль):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Значение, ниже которого находится 25% данных. 
                    Вычисляется как медиана нижней половины данных.</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Q2 (Второй квартиль):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>То же самое, что медиана — значение, делящее данные пополам (50-й перцентиль).</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>Q3 (Третий квартиль):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Значение, ниже которого находится 75% данных. 
                    Вычисляется как медиана верхней половины данных.</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--foreground)' }}>IQR (Межквартильный размах):</strong>
                    <p className="ml-4 mt-1" style={{ color: 'var(--foreground-secondary)' }}>Разница Q3 - Q1. Содержит средние 50% данных. 
                    Устойчивая мера разброса, не подверженная влиянию выбросов.</p>
                  </div>
                  </div>
                </div>

                {/* Границы и выбросы */}
                <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-900/20 shadow-lg hover:shadow-xl transition-shadow">
                  <h4 className="font-bold text-amber-300 mb-2 text-base flex items-center gap-2">
                    🚨 Границы и выбросы
                  </h4>
                  <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-amber-300">Минимум и Максимум:</strong>
                    <p className="ml-4 mt-1 text-amber-200/90">Наименьшее и наибольшее значения в наборе данных.</p>
                  </div>
                  <div>
                    <strong className="text-amber-300">Нижняя граница (Lower Fence):</strong>
                    <p className="ml-4 mt-1 text-amber-200/90">Q1 - 1.5·IQR. Значения ниже этой границы считаются выбросами.</p>
                  </div>
                  <div>
                    <strong className="text-amber-300">Верхняя граница (Upper Fence):</strong>
                    <p className="ml-4 mt-1 text-amber-200/90">Q3 + 1.5·IQR. Значения выше этой границы считаются выбросами.</p>
                  </div>
                  <div>
                    <strong className="text-amber-300">Выбросы (Outliers):</strong>
                    <p className="ml-4 mt-1 text-amber-200/90">Значения, выходящие за пределы границ (метод Тьюки). 
                    Это нетипичные наблюдения, которые могут быть ошибками измерения или редкими событиями.</p>
                  </div>
                  </div>
                </div>

                {/* Дополнительные показатели */}
                {/* <div className="p-4 rounded-xl border-2 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
                  <h4 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                    ➕ Дополнительные показатели
                  </h4>
                  <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-gray-800">Количество (Count):</strong>
                    <p className="ml-4 mt-1 text-gray-700">Общее число наблюдений в выборке.</p>
                  </div>
                  <div>
                    <strong className="text-gray-800">Сумма (Sum):</strong>
                    <p className="ml-4 mt-1 text-gray-700">Сумма всех значений в наборе данных.</p>
                  </div>
                  </div>
                </div> */}

                {/* Практический совет */}
                <div className="md:col-span-2 p-4 rounded-xl border-2 shadow-md" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    <strong>💡 Совет:</strong> Используйте несколько показателей вместе для полного понимания данных. 
                    Например, если среднее сильно отличается от медианы — это признак асимметричного распределения или наличия выбросов.
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Результаты */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                <TrendingUp className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                Результаты анализа
              </h2>

              {/* Статистические показатели */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Центральные тенденции */}
                <AnimatedResult type="calculation" title="Центральные тенденции" delay={0.1}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4 text-indigo-600">Центральные тенденции</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Среднее</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.mean)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Медиана</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.median)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Мода</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                          {result.mode.length > 0 ? result.mode.join(', ') : 'Нет'}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedResult>

                {/* Разброс данных */}
                <AnimatedResult type="calculation" title="Разброс данных" delay={0.2}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)' }}>Разброс данных</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Размах</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.range)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Дисперсия</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.variance)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Стд. отклонение</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.stdDev)}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedResult>

                {/* Квартили */}
                <AnimatedResult type="calculation" title="Квартили" delay={0.3}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)' }}>Квартили</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Q1 (25%)</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.q1)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Q3 (75%)</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.q3)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>IQR (Q3 - Q1)</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.iqr)}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedResult>

                {/* Границы */}
                <AnimatedResult type="calculation" title="Границы" delay={0.4}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)' }}>Границы</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Минимум</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.min)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Максимум</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.max)}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedResult>

                {/* Общая информация */}
                <AnimatedResult type="calculation" title="Общая информация" delay={0.5}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)' }}>Общая информация</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Количество</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{result.count}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Сумма</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(result.sum)}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedResult>

                {/* Выбросы */}
                {/* <AnimatedResult type="calculation" title="Выбросы" delay={0.6}>
                  <div className="p-6 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">Выбросы</h3>
                    {result.outliers.length > 0 ? (
                      <div>
                        <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                          Обнаружено: {result.outliers.length}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.outliers.map((outlier, i) => (
                            <span key={i} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                              {outlier.toFixed(2)}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                          <p>Нижняя граница: {result.lowerFence.toFixed(2)}</p>
                          <p>Верхняя граница: {result.upperFence.toFixed(2)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">✓ Выбросов не обнаружено</p>
                      </div>
                    )}
                  </div>
                </AnimatedResult> */}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default StatisticsPage;
