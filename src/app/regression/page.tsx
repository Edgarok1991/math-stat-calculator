'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { RegressionData, RegressionResult } from '@/types/calculator';
// import { calculatorStore } from '@/stores/CalculatorStore';
import { apiService } from '@/services/api';
import { StepGuide } from '@/components/UI/StepGuide';
import { InteractiveHint } from '@/components/UI/InteractiveHint';
import { AnimatedResult } from '@/components/UI/AnimatedResult';
import { FractionDisplay } from '@/components/UI';

const regressionSchema = z.object({
  x: z.string().min(1, 'Введите значения X'),
  y: z.string().min(1, 'Введите значения Y'),
  type: z.enum(['linear', 'polynomial', 'exponential']),
  degree: z.number().min(2).max(10).optional(),
});

type RegressionFormData = z.infer<typeof regressionSchema>;

function RegressionPage() {
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const regressionSteps = [
    {
      id: 'step1',
      title: 'Подготовка данных',
      description: 'Введите значения X и Y для анализа регрессии. Данные должны быть числовыми и разделенными запятыми.',
      content: (
        <div className="space-y-2">
          <p>• Введите значения X через запятую (например: 1,2,3,4,5)</p>
          <p>• Введите значения Y через запятую (например: 2,4,5,4,5)</p>
          <p>• Количество значений X и Y должно совпадать</p>
          <p>• Используйте десятичные числа при необходимости</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Выбор типа регрессии',
      description: 'Выберите подходящий тип регрессии в зависимости от характера ваших данных.',
      content: (
        <div className="space-y-2">
          <p>• <strong>Линейная:</strong> для линейной зависимости y = ax + b</p>
          <p>• <strong>Полиномиальная:</strong> для нелинейной зависимости y = ax² + bx + c</p>
          <p>• <strong>Экспоненциальная:</strong> для экспоненциальной зависимости y = ae^(bx)</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Настройка параметров',
      description: 'Для полиномиальной регрессии укажите степень полинома.',
      content: (
        <div className="space-y-2">
          <p>• Степень полинома: от 2 до 10</p>
          <p>• Чем выше степень, тем точнее аппроксимация</p>
          <p>• Слишком высокая степень может привести к переобучению</p>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Анализ результатов',
      description: 'Получите уравнение регрессии, коэффициент детерминации и другие метрики.',
      content: (
        <div className="space-y-2">
          <p>• R² показывает качество модели (0-1, чем ближе к 1, тем лучше)</p>
          <p>• Коэффициенты уравнения регрессии</p>
          <p>• Предсказанные значения и остатки</p>
          <p>• Визуализация результатов</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegressionFormData>({
    resolver: zodResolver(regressionSchema),
    defaultValues: {
      type: 'linear',
      degree: 2,
    },
  });

  const watchType = watch('type');

  const parseNumbers = (str: string): number[] => {
    return str.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  };

  const onSubmit = async (data: RegressionFormData) => {
    setIsLoading(true);
    try {
      const xValues = parseNumbers(data.x);
      const yValues = parseNumbers(data.y);

      if (xValues.length !== yValues.length) {
        throw new Error('Количество значений X и Y должно совпадать');
      }

      const regressionData: RegressionData = {
        x: xValues,
        y: yValues,
        type: data.type,
        degree: data.degree,
      };

      // Вызов API
      const result = await apiService.calculateRegression(regressionData);
      setResult(result);
      // calculatorStore.addCalculation({
      //   type: 'regression',
      //   input: regressionData,
      //   result: result,
      // });
    } catch (error) {
      console.error('Ошибка расчета:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="rounded-xl shadow-lg p-8 card-midnight"
        >
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                Регрессионный анализ
              </h1>
              <StepGuide
                steps={regressionSteps}
                title="Инструкция по регрессионному анализу"
                description="Пошаговое руководство по использованию калькулятора регрессии"
              />
            </div>
            <p className="text-center" style={{ color: 'var(--foreground-secondary)' }}>
              Выполните линейную, полиномиальную или экспоненциальную регрессию
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Форма ввода */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <InteractiveHint
                    title="Значения X"
                    content="Введите независимые переменные (X) через запятую или пробел. Это могут быть время, температура, цена и т.д."
                    type="info"
                  >
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Значения X (через запятую или пробел)
                    </label>
                  </InteractiveHint>
                  <textarea
                    {...register('x')}
                    className="w-full px-3 py-2 input-midnight rounded-md"
                    rows={3}
                    placeholder="1, 2, 3, 4, 5"
                  />
                  {errors.x && (
                    <p className="mt-1 text-sm text-red-400">{errors.x.message}</p>
                  )}
                </div>

                <div>
                  <InteractiveHint
                    title="Значения Y"
                    content="Введите зависимые переменные (Y) через запятую или пробел. Это значения, которые вы хотите предсказать или объяснить."
                    type="info"
                  >
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Значения Y (через запятую или пробел)
                    </label>
                  </InteractiveHint>
                  <textarea
                    {...register('y')}
                    className="w-full px-3 py-2 input-midnight rounded-md"
                    rows={3}
                    placeholder="2.1, 4.3, 6.8, 8.9, 11.2"
                  />
                  {errors.y && (
                    <p className="mt-1 text-sm text-red-400">{errors.y.message}</p>
                  )}
                </div>

                <div>
                  <InteractiveHint
                    title="Тип регрессии"
                    content="Выберите тип регрессии в зависимости от характера зависимости между X и Y. Линейная для прямой линии, полиномиальная для кривых, экспоненциальная для экспоненциального роста."
                    type="tip"
                  >
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Тип регрессии
                    </label>
                  </InteractiveHint>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 input-midnight rounded-md"
                  >
                    <option value="linear">Линейная</option>
                    <option value="polynomial">Полиномиальная</option>
                    <option value="exponential">Экспоненциальная</option>
                  </select>
                </div>

                {watchType === 'polynomial' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Степень полинома
                    </label>
                    <input
                      type="number"
                      {...register('degree', { valueAsNumber: true })}
                      min="2"
                      max="10"
                      className="w-full px-3 py-2 input-midnight rounded-md"
                      placeholder=""
                    />
                    {errors.degree && (
                      <p className="mt-1 text-sm text-red-400">{errors.degree.message}</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Вычисляем...' : 'Выполнить регрессию'}
                </Button>
              </form>
            </div>

            {/* Результаты */}
            <div>
              {result && (
                <AnimatedResult
                  type="calculation"
                  title="Результаты регрессии"
                  delay={0.2}
                >
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Уравнение:</span>
                      <p className="text-lg font-mono p-2 rounded border" style={{ background: 'var(--background-tertiary)', borderColor: 'var(--border)' }}>
                        {result.equation}
                      </p>
                    </div>
                    
                    <div>
                      <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Коэффициент детерминации (R²):</span>
                      <p className="text-lg font-mono">
                        <FractionDisplay value={result.rSquared} />
                      </p>
                    </div>
                    
                    <div>
                      <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Коэффициенты:</span>
                      <p className="text-sm font-mono p-2 rounded border" style={{ background: 'var(--background-tertiary)', borderColor: 'var(--border)' }}>
                        [{result.coefficients.map((c, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            <FractionDisplay value={c} className="inline" />
                          </span>
                        ))}]
                      </p>
                    </div>
                  </div>
                </AnimatedResult>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default RegressionPage;
