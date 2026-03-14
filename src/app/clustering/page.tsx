'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { ClusteringData, ClusteringResult } from '@/types/calculator';
import { calculatorStore } from '@/stores/CalculatorStore';
import { observer } from 'mobx-react-lite';
import { StepGuide } from '@/components/UI/StepGuide';
import { apiService } from '@/services/api';
import { ClusteringStepsView } from '@/components/clustering/ClusteringStepsView';
import { DendrogramView } from '@/components/clustering/DendrogramView';
import Link from 'next/link';

const clusteringSchema = z.object({
  points: z.string().min(1, 'Введите точки данных'),
  k: z.number().min(2, 'Минимум 2 кластеров').max(20, 'Максимум 20 кластеров'),
  method: z.enum(['kmeans', 'hierarchical', 'single', 'complete', 'average']),
});

type ClusteringFormData = z.infer<typeof clusteringSchema>;

function ClusteringPage() {
  const [result, setResult] = useState<ClusteringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputPoints, setInputPoints] = useState<number[][]>([]);

  const clusteringSteps = [
    {
      id: 'step1',
      title: 'Подготовка данных',
      description: 'Введите точки данных для кластеризации. Каждая точка должна содержать координаты, разделенные запятыми.',
      content: (
        <div className="space-y-2">
          <p>• Формат: [x1,y1], [x2,y2], [x3,y3] или x1,y1; x2,y2; x3,y3</p>
          <p>• Минимум 2 точки, рекомендуется от 10 до 1000</p>
          <p>• Все точки должны иметь одинаковую размерность</p>
          <p>• Пример: [1,2], [3,4], [5,6] или 1,2; 3,4; 5,6</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Выбор количества кластеров',
      description: 'Укажите количество кластеров (k) для группировки данных.',
      content: (
        <div className="space-y-2">
          <p>• K-means: от 2 до 20 кластеров</p>
          <p>• Иерархическая: автоматическое определение</p>
          <p>• Рекомендуется: √(n/2), где n - количество точек</p>
          <p>• Слишком много кластеров может привести к переобучению</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Выбор метода кластеризации',
      description: 'Выберите алгоритм кластеризации в зависимости от ваших данных.',
      content: (
        <div className="space-y-2">
          <p>• <strong>K-means:</strong> быстрый, для сферических кластеров</p>
          <p>• <strong>Иерархическая:</strong> медленный, для кластеров любой формы</p>
          <p>• <strong>Ближний сосед:</strong> минимальное расстояние между кластерами</p>
          <p>• <strong>Дальний сосед:</strong> максимальное расстояние между кластерами</p>
          <p>• <strong>Средний:</strong> среднее расстояние между всеми точками кластеров</p>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Анализ результатов',
      description: 'Получите информацию о кластерах, центроидах и метриках качества.',
      content: (
        <div className="space-y-2">
          <p>• Центроиды кластеров (средние точки)</p>
          <p>• Принадлежность каждой точки к кластеру</p>
          <p>• Inertia (сумма квадратов расстояний до центроидов)</p>
          <p>• Визуализация результатов на графике</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClusteringFormData>({
    resolver: zodResolver(clusteringSchema),
    defaultValues: {
      k: 2,
      method: 'single',
      points: '2, 8\n4, 10\n5, 7\n12, 6\n14, 6\n15, 4',
    },
  });

  const parsePoints = (str: string): number[][] => {
    return str.split('\n').map(line => 
      line.split(/[,\s]+/).map(Number).filter(n => !isNaN(n))
    ).filter(point => point.length > 0);
  };

  const onSubmit = async (data: ClusteringFormData) => {
    setIsLoading(true);
    try {
      console.log('Raw form data:', data);
      const points = parsePoints(data.points);
      console.log('Parsed points:', points);

      if (points.length < data.k) {
        throw new Error('Количество точек должно быть больше количества кластеров');
      }

      setInputPoints(points);

      const clusteringData: ClusteringData = {
        points,
        k: data.k,
        method: data.method,
      };

      console.log('Sending clustering data:', clusteringData);

      // Вызов API
      const result = await apiService.calculateClustering(clusteringData);
      setResult(result);
      calculatorStore.addCalculation({
        type: 'clustering',
        input: clusteringData,
        result: result,
      });
    } catch (error) {
      console.error('Ошибка кластеризации:', error);
      alert('Ошибка при выполнении кластеризации: ' + (error as Error).message);
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
                Кластерный анализ
              </h1>
              <StepGuide
                steps={clusteringSteps}
                title="Инструкция по кластерному анализу"
                description="Пошаговое руководство по использованию калькулятора кластеризации"
              />
            </div>
            <p className="text-gray-600 text-center">
              Выполните K-means или иерархическую кластеризацию данных
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Форма ввода */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Формат ввода данных</h4>
                  <p className="text-xs text-gray-700 mb-2">
                    Каждая строка = один объект. Значения разделяйте запятыми.
                  </p>
                  <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">
                    Пример: 2, 8 (объект с x=2, y=8)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Точки данных (каждая точка на новой строке)
                  </label>
                  <textarea
                    {...register('points')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={8}
                    placeholder="2, 8&#10;4, 10&#10;5, 7&#10;12, 6&#10;14, 6&#10;15, 4"
                  />
                  {errors.points && (
                    <p className="mt-1 text-sm text-red-600">{errors.points.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество кластеров
                  </label>
                  <input
                    type="number"
                    {...register('k', { valueAsNumber: true })}
                    min="2"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder=""
                  />
                  {errors.k && (
                    <p className="mt-1 text-sm text-red-600">{errors.k.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Метод кластеризации
                  </label>
                  <select
                    {...register('method')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">🔵 Ближний сосед (Single Linkage)</option>
                    <option value="complete">🔴 Дальний сосед (Complete Linkage)</option>
                    <option value="average">🟡 Средний (Average Linkage)</option>
                    <option value="kmeans">⚡ K-means</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-600">
                    💡 Для детального пошагового решения выбирайте иерархические методы
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Кластеризуем...' : 'Выполнить кластеризацию'}
                </Button>
              </form>
            </div>

            {/* Краткие результаты */}
            <div>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Краткие результаты
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="font-medium text-gray-700">Метод:</span>
                      <p className="text-lg font-semibold text-blue-900">
                        {result.method === 'single' ? 'Ближний сосед (Single Linkage)' :
                         result.method === 'complete' ? 'Дальний сосед (Complete Linkage)' :
                         result.method === 'average' ? 'Средний (Average Linkage)' :
                         result.method || 'K-means'}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="font-medium text-gray-700">Количество кластеров:</span>
                      <p className="text-2xl font-bold text-blue-900">
                        {result.clusters.length}
                      </p>
                    </div>

                    {result.finalDistance !== undefined && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <span className="font-medium text-gray-700">Расстояние между кластерами:</span>
                        <p className="text-2xl font-bold text-green-900">
                          P = {result.finalDistance.toFixed(2)}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="font-medium text-gray-700">Итоговые кластеры:</span>
                      <div className="mt-2 space-y-2">
                        {result.clusters.map((cluster, index) => (
                          <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="font-semibold text-blue-900">S({cluster.map(i => i + 1).join(',')}):</span>
                            <span className="ml-2 text-sm font-mono text-gray-700">
                              объекты [{cluster.map(i => i + 1).join(', ')}]
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

          {/* Детальные результаты */}
          {result && result.steps && result.steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8"
            >
              <ClusteringStepsView steps={result.steps} inputPoints={inputPoints} />
            </motion.div>
          )}

          {/* Дендрограмма */}
          {result && result.dendrogramData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8"
            >
              <DendrogramView data={result.dendrogramData} width={1000} height={500} />
            </motion.div>
          )}

          {/* Заключение */}
          {result && result.finalDistance !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-8 bg-green-50 rounded-lg p-6 border-2 border-green-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">Заключение</h3>
              <p className="text-gray-700 leading-relaxed">
                Таким образом, при проведении кластерного анализа по принципу{' '}
                <span className="font-semibold">
                  "{result.method === 'single' ? 'ближнего соседа' : 
                    result.method === 'complete' ? 'дальнего соседа' : 'среднего'}"
                </span>
                {' '}получили <span className="font-bold text-green-900">{result.clusters.length} кластера</span>, 
                расстояние между которыми равно{' '}
                <span className="font-bold text-green-900">P = {result.finalDistance.toFixed(2)}</span>.
              </p>
              <p className="text-gray-700 mt-3">
                Результаты иерархической классификации объектов представлены выше в виде дендрограммы.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default observer(ClusteringPage);
