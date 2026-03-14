'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { AnovaData, AnovaResult } from '@/types/calculator';
import { calculatorStore } from '@/stores/CalculatorStore';
import { observer } from 'mobx-react-lite';
import { StepGuide } from '@/components/UI/StepGuide';
import Link from 'next/link';

const anovaSchema = z.object({
  groups: z.string().min(1, 'Введите данные групп'),
  alpha: z.number().min(0.01).max(0.1),
});

type AnovaFormData = z.infer<typeof anovaSchema>;

function AnovaPage() {
  const [result, setResult] = useState<AnovaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const anovaSteps = [
    {
      id: 'step1',
      title: 'Подготовка данных групп',
      description: 'Введите данные для каждой группы, которые вы хотите сравнить.',
      content: (
        <div className="space-y-2">
          <p>• Формат: Группа1: 1,2,3,4; Группа2: 5,6,7,8; Группа3: 9,10,11,12</p>
          <p>• Минимум 2 группы, рекомендуется 3-5 групп</p>
          <p>• В каждой группе минимум 2 наблюдения</p>
          <p>• Все данные должны быть числовыми</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Выбор уровня значимости',
      description: 'Укажите уровень значимости (α) для статистического теста.',
      content: (
        <div className="space-y-2">
          <p>• Обычно используется α = 0.05 (5%)</p>
          <p>• Более строгий: α = 0.01 (1%)</p>
          <p>• Более мягкий: α = 0.1 (10%)</p>
          <p>• Чем меньше α, тем строже критерий значимости</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Выполнение ANOVA',
      description: 'Система автоматически выполнит однофакторный дисперсионный анализ.',
      content: (
        <div className="space-y-2">
          <p>• Вычисление F-статистики</p>
          <p>• Определение p-значения</p>
          <p>• Сравнение с критическим значением</p>
          <p>• Проверка предположений ANOVA</p>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Интерпретация результатов',
      description: 'Получите выводы о статистической значимости различий между группами.',
      content: (
        <div className="space-y-2">
          <p>• p &lt; α: различия статистически значимы</p>
          <p>• p ≥ α: различия не значимы</p>
          <p>• Средние значения и дисперсии групп</p>
          <p>• Рекомендации по дальнейшему анализу</p>
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
    },
  });

  const parseGroups = (str: string): number[][] => {
    return str.split('\n').map(line => 
      line.split(/[,\s]+/).map(Number).filter(n => !isNaN(n))
    ).filter(group => group.length > 0);
  };

  const onSubmit = async (data: AnovaFormData) => {
    setIsLoading(true);
    try {
      const groups = parseGroups(data.groups);

      if (groups.length < 2) {
        throw new Error('Необходимо минимум 2 группы');
      }

      const anovaData: AnovaData = {
        groups,
        alpha: data.alpha,
      };

      // Здесь будет вызов API
      const mockResult: AnovaResult = {
        fStatistic: 12.45,
        pValue: 0.001,
        criticalValue: 3.89,
        significant: true,
        groupMeans: [15.2, 18.7, 22.1, 19.8],
        groupVariances: [2.3, 3.1, 2.8, 2.9],
      };

      setResult(mockResult);
      calculatorStore.addCalculation({
        type: 'anova',
        input: anovaData,
        result: mockResult,
      });
    } catch (error) {
      console.error('Ошибка ANOVA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/data-analysis" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors">
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
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Дисперсионный анализ (ANOVA)
              </h1>
              <StepGuide
                steps={anovaSteps}
                title="Инструкция по ANOVA"
                description="Пошаговое руководство по использованию калькулятора дисперсионного анализа"
              />
            </div>
            <p className="text-gray-600 text-center">
              Сравните средние значения нескольких групп с помощью F-теста
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Форма ввода */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Данные групп (каждая группа на новой строке)
                  </label>
                  <textarea
                    {...register('groups')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="15, 16, 14, 15, 17&#10;18, 19, 17, 18, 20&#10;22, 21, 23, 22, 24&#10;19, 20, 18, 19, 21"
                  />
                  {errors.groups && (
                    <p className="mt-1 text-sm text-red-600">{errors.groups.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Уровень значимости (α)
                  </label>
                  <select
                    {...register('alpha', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0.01}>0.01 (1%)</option>
                    <option value={0.05}>0.05 (5%)</option>
                    <option value={0.1}>0.1 (10%)</option>
                  </select>
                  {errors.alpha && (
                    <p className="mt-1 text-sm text-red-600">{errors.alpha.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Вычисляем...' : 'Выполнить ANOVA'}
                </Button>
              </form>
            </div>

            {/* Результаты */}
            <div>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Результаты ANOVA
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">F-статистика:</span>
                        <p className="text-lg font-mono">
                          {result.fStatistic.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">p-значение:</span>
                        <p className="text-lg font-mono">
                          {result.pValue.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Критическое значение:</span>
                        <p className="text-lg font-mono">
                          {result.criticalValue.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Результат:</span>
                        <p className={`text-lg font-semibold ${
                          result.significant ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {result.significant ? 'Значимо' : 'Не значимо'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Средние по группам:</span>
                      <div className="mt-2 space-y-1">
                        {result.groupMeans.map((mean, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-sm">
                            <span className="font-medium">Группа {index + 1}:</span>
                            <span className="ml-2 font-mono">
                              {mean.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Дисперсии по группам:</span>
                      <div className="mt-2 space-y-1">
                        {result.groupVariances.map((variance, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-sm">
                            <span className="font-medium">Группа {index + 1}:</span>
                            <span className="ml-2 font-mono">
                              {variance.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default observer(AnovaPage);

