'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Sigma } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/components/UI/Button';
import { StepGuide } from '@/components/UI/StepGuide';
import { MathExpression } from '@/components/UI/MathExpression';
import { MathFormula, Frac, Pow, Sqrt, Sub } from '@/components/UI/MathFormula';
import { IntegralSymbol } from '@/components/UI/IntegralSymbol';
import { TextWithFractions } from '@/components/UI/TextWithFractions';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const derivativeSchema = z.object({
  expression: z.string().min(1, 'Введите функцию'),
  variable: z.string().min(1, 'Введите переменную').default('x'),
  order: z.number().min(1).max(5).default(1),
  simplify: z.boolean().default(true),
  xMin: z.number().default(-10),
  xMax: z.number().default(10),
});

const integralSchema = z.object({
  expression: z.string().min(1, 'Введите функцию'),
  variable: z.string().min(1, 'Введите переменную').default('x'),
  integralType: z.enum(['indefinite', 'definite']).default('indefinite'),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
}).refine((data) => {
  // Для определённого интеграла пределы обязательны
  if (data.integralType === 'definite') {
    return data.lowerBound !== undefined && data.upperBound !== undefined;
  }
  return true;
}, {
  message: 'Для определённого интеграла укажите оба предела',
  path: ['lowerBound'],
});

type DerivativeFormData = z.infer<typeof derivativeSchema>;
type IntegralFormData = z.infer<typeof integralSchema>;

interface DerivativeResult {
  original: string;
  derivative: string;
  simplified?: string;
  steps: Array<{
    step: number;
    rule: string;
    expression: string;
    explanation: string;
  }>;
  variable: string;
  order: number;
  graphData: {
    original: Array<{ x: number; y: number }>;
    derivative: Array<{ x: number; y: number }>;
    xMin: number;
    xMax: number;
  };
}

function CalculusPage() {
  const [activeTab, setActiveTab] = useState<'derivatives' | 'integrals'>('derivatives');
  const [derivativeResult, setDerivativeResult] = useState<DerivativeResult | null>(null);
  const [integralResult, setIntegralResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [pointResult, setPointResult] = useState<any>(null);
  const [showTangent, setShowTangent] = useState(false);
  const [integralType, setIntegralType] = useState<'indefinite' | 'definite'>('indefinite');

  const derivativeForm = useForm({
    resolver: zodResolver(derivativeSchema),
    defaultValues: {
      expression: 'x^2',
      variable: 'x',
      order: 1,
      simplify: true,
      xMin: -10,
      xMax: 10,
    },
  });

  const integralForm = useForm({
    resolver: zodResolver(integralSchema),
    defaultValues: {
      expression: 'x^2',
      variable: 'x',
      integralType: 'indefinite' as 'indefinite' | 'definite',
    },
  });

  const watchedDerivativeExpr = derivativeForm.watch('expression');
  const watchedIntegralExpr = integralForm.watch('expression');

  const onSubmitDerivative = async (data: DerivativeFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.calculateDerivativeWithGraph({
        expression: data.expression,
        variable: data.variable,
        order: data.order,
        simplify: data.simplify,
        xMin: data.xMin,
        xMax: data.xMax,
      });
      setDerivativeResult(response);
      setSelectedPoint(null);
      setPointResult(null);
      setShowTangent(false);
    } catch (error) {
      console.error('Error calculating derivative:', error);
      alert('Ошибка вычисления производной. Проверьте введённую функцию.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitIntegral = async (data: IntegralFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.calculateIntegral({
        expression: data.expression,
        variable: data.variable,
        integralType: data.integralType,
        lowerBound: data.lowerBound,
        upperBound: data.upperBound,
      });
      
      setIntegralResult(response);
      console.log('Integral result:', response);
    } catch (error) {
      console.error('Error calculating integral:', error);
      alert('Ошибка вычисления интеграла. Проверьте введённую функцию.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAtPoint = async (point: number) => {
    if (!derivativeResult) return;
    
    try {
      const response = await apiService.calculateDerivativeAtPoint({
        expression: derivativeResult.original,
        variable: derivativeResult.variable,
        point,
        order: derivativeResult.order,
      });
      setPointResult(response);
      setSelectedPoint(point);
      setShowTangent(true);
    } catch (error) {
      console.error('Error calculating derivative at point:', error);
      alert('Ошибка вычисления в точке');
    }
  };

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Calculator className="w-12 h-12 text-indigo-600" />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--foreground)' }}>
                Математический анализ
              </h1>
            </div>
            <p className="text-xl" style={{ color: 'var(--foreground-secondary)' }}>
              Производные и интегралы с пошаговым решением
            </p>
          </div>

          {/* Переключатель вкладок (как в матрицах) */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-lg border-2 p-1" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('derivatives');
                  setDerivativeResult(null);
                  setSelectedPoint(null);
                  setPointResult(null);
                  setShowTangent(false);
                }}
                className={`px-8 py-3 rounded-md transition-all font-semibold flex items-center gap-2 ${
                  activeTab === 'derivatives' ? 'gradient-primary text-white shadow-lg' : ''
                }`}
                style={activeTab === 'derivatives' ? {} : { color: 'var(--foreground-secondary)' }}
              >
                <TrendingUp className="w-5 h-5" />
                Производные
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('integrals');
                  setIntegralResult(null);
                }}
                className={`px-8 py-3 rounded-md transition-all font-semibold flex items-center gap-2 ${
                  activeTab === 'integrals' ? 'gradient-primary text-white shadow-lg' : ''
                }`}
                style={activeTab === 'integrals' ? {} : { color: 'var(--foreground-secondary)' }}
              >
                <Sigma className="w-5 h-5" />
                Интегралы
              </button>
            </div>
          </div>

          {/* Вкладка ПРОИЗВОДНЫЕ */}
          {activeTab === 'derivatives' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Левая колонка: Форма и результаты */}
              <div className="lg:col-span-2 space-y-8">
              {/* Форма ввода для производных */}
            <div>
                <div className="p-6 rounded-2xl border-2 shadow-lg" 
                  style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      <TrendingUp className="w-6 h-6 text-indigo-600" />
                      Вычисление производной
                    </h2>
                    <StepGuide 
                      title="Как вычислить производную"
                      description="Следуйте этим простым шагам"
                      steps={[
                        {
                          id: 'step1',
                          title: 'Введите функцию',
                          description: 'Запишите функцию, используя стандартные обозначения',
                          content: <div className="text-sm"><p>Например: x^2, sin(x), ln(x), exp(x)</p></div>,
                        },
                        {
                          id: 'step2',
                          title: 'Настройте параметры',
                          description: 'Укажите переменную и порядок производной',
                          content: <div className="text-sm"><p>По умолчанию вычисляется первая производная</p></div>,
                        },
                        {
                          id: 'step3',
                          title: 'Получите результат',
                          description: 'Нажмите "Вычислить" и увидите производную, пошаговое решение с объяснением каждого правила и график.',
                          content: <div className="text-sm"><p>Можно вычислить значение в любой точке</p></div>,
                        },
                      ]}
                    />
                  </div>

                  <form onSubmit={derivativeForm.handleSubmit(onSubmitDerivative)} className="space-y-6">
                    {/* Функция */}
                <div>
                      <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Функция f(x)
                  </label>
                  <input
                        {...derivativeForm.register('expression')}
                        className="w-full px-4 py-3 rounded-lg border-2 text-lg font-mono transition-all focus:ring-2 focus:ring-indigo-500"
                        style={{ borderColor: 'var(--border)' }}
                        placeholder="x^2"
                      />
                      {watchedDerivativeExpr && (
                        <div className="mt-2 p-3 rounded-lg min-h-[2.5rem] flex items-center" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                          <span className="text-sm text-gray-500 mr-2">f(x) =</span>
                          <MathExpression expression={watchedDerivativeExpr} className="text-xl" />
                        </div>
                      )}
                      {/* <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-2">⚡ Быстрый выбор примеров:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { expr: 'x^2', label: 'x²' },
                            { expr: 'x^3 - 2*x + 1', label: 'Полином' },
                            { expr: 'sin(x)', label: 'sin(x)' },
                            { expr: 'cos(x)', label: 'cos(x)' },
                            { expr: 'exp(x)', label: 'eˣ' },
                            { expr: 'ln(x)', label: 'ln(x)' },
                            { expr: 'x * sin(x)', label: 'Произведение' },
                            { expr: 'sin(x) / x', label: 'Частное' },
                            { expr: 'sqrt(x)', label: '√x' },
                            { expr: 'x^2 * exp(x)', label: 'Сложная' },
                          ].map((example, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => derivativeForm.setValue('expression', example.expr)}
                              className="px-3 py-1.5 bg-white border-2 border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all hover:scale-105"
                            >
                              {example.label}
                            </button>
                          ))}
                        </div>
                      </div> */}
                      {derivativeForm.formState.errors.expression && (
                        <p className="mt-1 text-sm text-red-600">{derivativeForm.formState.errors.expression.message}</p>
                  )}
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Переменная */}
                <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    Переменная
                  </label>
                  <input
                          {...derivativeForm.register('variable')}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: 'var(--border)' }}
                    placeholder="x"
                  />
                </div>

                      {/* Порядок производной */}
                <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                          Порядок производной
                  </label>
                  <select
                          {...derivativeForm.register('order', { valueAsNumber: true })}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <option value={1}>Первая (f')</option>
                          <option value={2}>Вторая (f'')</option>
                          <option value={3}>Третья (f''')</option>
                          <option value={4}>Четвёртая</option>
                          <option value={5}>Пятая</option>
                  </select>
                </div>

                      {/* Упрощение */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                          Упрощать результат
                        </label>
                        <div className="flex items-center h-10">
                          <input
                            type="checkbox"
                            {...derivativeForm.register('simplify')}
                            className="w-5 h-5 rounded border-2 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                            defaultChecked
                          />
                          <span className="ml-2 text-sm" style={{ color: 'var(--foreground)' }}>Да</span>
                        </div>
                      </div>
                    </div>

                    {/* Диапазон для графика */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                          X min (для графика)
                      </label>
                      <input
                        type="number"
                          step="any"
                          {...derivativeForm.register('xMin', { valueAsNumber: true })}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                          X max (для графика)
                      </label>
                      <input
                        type="number"
                          step="any"
                          {...derivativeForm.register('xMax', { valueAsNumber: true })}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                  </div>

                <Button
                  type="submit"
                  loading={isLoading}
                      disabled={isLoading}
                      className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-white"
                >
                      {isLoading ? '⏳ Вычисляю...' : '🧮 Вычислить производную'}
                </Button>
              </form>
                </div>
            </div>

              {/* Результаты производных */}
              {derivativeResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Результат производной */}
                  <div className="p-6 rounded-2xl border-2 bg-white shadow-xl" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-2xl font-bold mb-4 text-indigo-600">📊 Результат</h3>
                  
                  <div className="space-y-4">
                      {/* Исходная функция */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Исходная функция:</p>
                        <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <span>f({derivativeResult.variable}) =</span>
                          <MathExpression expression={derivativeResult.original} className="text-2xl" />
                        </div>
                      </div>

                      {/* Производная */}
                      <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-300">
                        <p className="text-sm text-indigo-600 mb-1">
                          {derivativeResult.order === 1 ? 'Первая производная' : `Производная ${derivativeResult.order}-го порядка`}:
                        </p>
                        <div className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                          <span>f{"'".repeat(derivativeResult.order)}({derivativeResult.variable}) =</span>
                          <MathExpression expression={derivativeResult.derivative} className="text-2xl" />
                        </div>
                      </div>

                      {/* Упрощённая форма */}
                      {derivativeResult.simplified && derivativeResult.simplified !== derivativeResult.derivative && (
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                          <p className="text-sm text-green-600 mb-1 flex items-center gap-2">
                            ✨ Упрощённая форма:
                          </p>
                          <div className="text-2xl font-bold text-green-900">
                            <MathExpression expression={derivativeResult.simplified} className="text-2xl" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Пошаговое решение */}
                  <div className="p-6 rounded-2xl border-2 bg-white shadow-xl" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-2xl font-bold mb-6 text-purple-600">📝 Пошаговое решение</h3>
                    
                    <div className="space-y-4">
                      {derivativeResult.steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-4 rounded-lg border-l-4 border-purple-500 bg-purple-50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                              {step.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-purple-900 mb-2 text-lg">{step.rule}</h4>
                              <div className="text-sm text-purple-700 mb-3" style={{ lineHeight: '1.6' }}>
                                <MathExpression expression={step.explanation} className="text-sm" />
                              </div>
                              <div className="p-4 bg-white rounded-lg border-2 border-purple-200 shadow-sm overflow-x-auto">
                                <div className="whitespace-nowrap">
                                  <MathExpression expression={step.expression} className="text-lg" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Графики f(x) и f'(x) */}
                  <div className="p-6 rounded-2xl border-2 bg-white shadow-xl" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-blue-600">📈 Графическая визуализация</h3>
                      
                      {/* Вычисление в точке */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          Вычислить в точке:
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="x = 0"
                          className="px-3 py-2 rounded-lg border-2 w-24"
                          style={{ borderColor: 'var(--border)' }}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) calculateAtPoint(val);
                          }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4" style={{ color: 'var(--foreground-secondary)' }}>
                      Синий график - исходная функция f(x), Красный график - производная f'(x)
                      {showTangent && ', Зелёная линия - касательная'}
                    </p>

                    {/* @ts-ignore */}
                    <Plot
                      data={[
                        // График исходной функции
                        {
                          x: derivativeResult.graphData.original.map(p => p.x),
                          y: derivativeResult.graphData.original.map(p => p.y),
                          type: 'scatter',
                          mode: 'lines',
                          name: `f(${derivativeResult.variable})`,
                          line: {
                            color: '#3b82f6',
                            width: 3,
                          },
                          hovertemplate: `f(${derivativeResult.variable}): %{y:.4f}<extra></extra>`,
                        } as any,
                        // График производной
                        {
                          x: derivativeResult.graphData.derivative.map(p => p.x),
                          y: derivativeResult.graphData.derivative.map(p => p.y),
                          type: 'scatter',
                          mode: 'lines',
                          name: `f${"'".repeat(derivativeResult.order)}(${derivativeResult.variable})`,
                          line: {
                            color: '#ef4444',
                            width: 3,
                            dash: 'dash',
                          },
                          hovertemplate: `f'(${derivativeResult.variable}): %{y:.4f}<extra></extra>`,
                        } as any,
                        // Касательная линия (если выбрана точка)
                        ...(showTangent && pointResult ? [{
                          x: [derivativeResult.graphData.xMin, derivativeResult.graphData.xMax],
                          y: [
                            pointResult.value * (derivativeResult.graphData.xMin - pointResult.point) + pointResult.functionValue,
                            pointResult.value * (derivativeResult.graphData.xMax - pointResult.point) + pointResult.functionValue,
                          ],
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Касательная',
                          line: {
                            color: '#10b981',
                            width: 2,
                            dash: 'dot',
                          },
                          hovertemplate: `Касательная: y = ${pointResult.value.toFixed(4)}·(x - ${pointResult.point}) + ${pointResult.functionValue.toFixed(4)}<extra></extra>`,
                        } as any] : []),
                        // Точка касания
                        ...(selectedPoint !== null && pointResult ? [{
                          x: [pointResult.point],
                          y: [pointResult.functionValue],
                          type: 'scatter',
                          mode: 'markers',
                          name: 'Точка',
                          marker: {
                            color: '#10b981',
                            size: 12,
                            symbol: 'circle',
                            line: {
                              color: '#059669',
                              width: 2,
                            },
                          },
                          hovertemplate: `Точка: (${pointResult.point}, ${pointResult.functionValue.toFixed(4)})<br>f'(${pointResult.point}) = ${pointResult.value.toFixed(4)}<extra></extra>`,
                        } as any] : []),
                      ]}
                      layout={{
                        autosize: true,
                        height: 550,
                        title: {
                          text: `График f(${derivativeResult.variable}) и f${"'".repeat(derivativeResult.order)}(${derivativeResult.variable})`,
                          font: { size: 20, color: '#1e293b' }
                        },
                        xaxis: {
                          title: { text: derivativeResult.variable, font: { size: 16 } },
                          gridcolor: '#e2e8f0',
                          zeroline: true,
                          zerolinecolor: '#94a3b8',
                          zerolinewidth: 2,
                        },
                        yaxis: {
                          title: { text: 'Значение', font: { size: 16 } },
                          gridcolor: '#e2e8f0',
                          zeroline: true,
                          zerolinecolor: '#94a3b8',
                          zerolinewidth: 2,
                        },
                        plot_bgcolor: '#fafafa',
                        paper_bgcolor: 'white',
                        hovermode: 'x unified',
                        showlegend: true,
                        legend: {
                          x: 0.02,
                          y: 0.98,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          bordercolor: '#e2e8f0',
                          borderwidth: 2,
                        },
                      }}
                      config={{
                        displayModeBar: true,
                        displaylogo: false,
                        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                        toImageButtonOptions: {
                          format: 'png',
                          filename: 'производная_график',
                          width: 1400,
                          height: 800,
                        },
                      }}
                      style={{ width: '100%' }}
                    />

                    {/* Информация о графиках */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-blue-900 mb-2">📘 Исходная функция f({derivativeResult.variable})</h4>
                        <p className="text-sm text-blue-800">
                          Синяя сплошная линия показывает график исходной функции. Точки, где f'(x) = 0, являются 
                          <strong> экстремумами</strong> (максимумами или минимумами).
                        </p>
                          </div>
                      <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <h4 className="font-bold text-red-900 mb-2">📕 Производная f'({derivativeResult.variable})</h4>
                        <p className="text-sm text-red-800">
                          Красная пунктирная линия показывает производную. Где она <strong>положительна</strong> — функция растёт, 
                          где <strong>отрицательна</strong> — функция убывает, где <strong>= 0</strong> — экстремум.
                        </p>
                      </div>
                    </div>

                    {/* Результаты вычисления в точке */}
                    {pointResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300"
                      >
                        <h4 className="text-lg font-bold text-green-900 mb-4">
                          🎯 Значения в точке {derivativeResult.variable} = {pointResult.point}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                            <p className="text-xs text-green-600 font-semibold mb-2">Значение функции:</p>
                            <div className="text-xl font-bold text-green-900 flex items-baseline gap-2">
                              <span>f({pointResult.point}) =</span>
                              <span className="text-2xl">{pointResult.functionValue.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                            <p className="text-xs text-green-600 font-semibold mb-2">Значение производной:</p>
                            <div className="text-xl font-bold text-green-900 flex items-baseline gap-2">
                              <span>f'({pointResult.point}) =</span>
                              <span className="text-2xl">{pointResult.value.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                            <p className="text-xs text-green-600 font-semibold mb-2">Уравнение касательной:</p>
                            <div className="text-base font-bold text-green-900">
                              <span>y = </span>
                              <MathExpression expression={pointResult.tangentLine} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Геометрический смысл:</strong> Производная f'({pointResult.point}) = {pointResult.value.toFixed(4)} 
                            показывает <strong>угловой коэффициент</strong> касательной к графику функции в точке 
                            ({pointResult.point}, {pointResult.functionValue.toFixed(4)}). Это скорость изменения функции в данной точке.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                </motion.div>
              )}

              </div>

              {/* Правая колонка: Таблица правил (sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <div className="p-5 rounded-2xl border-2 bg-white shadow-xl" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4 text-emerald-600 border-b-2 border-emerald-200 pb-2">
                      Таблица производных
                    </h3>
                    
                    <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Базовые правила */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Базовые правила
                        </h4>
                        <div className="space-y-2">
                          {[
                            { rule: '(C)\' = 0', desc: 'Константа' },
                            { rule: '(x)\' = 1', desc: 'Переменная' },
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                              <div className="font-semibold text-emerald-900 mb-0.5">
                                <MathExpression expression={item.rule} className="text-sm" />
                              </div>
                              <p className="text-xs text-emerald-700">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Степенные и корни */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Степени и корни
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                            <div className="font-semibold text-blue-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Pow base="x" exp="n" />)' = n·<Pow base="x" exp="n-1" />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-blue-700">Степенная функция</p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                            <div className="font-semibold text-blue-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Sqrt>x</Sqrt>)' = <Frac num="1" den={<>2<Sqrt>x</Sqrt></>} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-blue-700">Квадратный корень</p>
                          </div>
                        </div>
                      </div>

                      {/* Тригонометрические */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Тригонометрия
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition-colors">
                            <div className="font-semibold text-cyan-900 mb-0.5 text-sm">
                              <MathFormula>(sin x)' = cos x</MathFormula>
                            </div>
                            <p className="text-xs text-cyan-700">Синус</p>
                          </div>
                          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition-colors">
                            <div className="font-semibold text-cyan-900 mb-0.5 text-sm">
                              <MathFormula>(cos x)' = -sin x</MathFormula>
                            </div>
                            <p className="text-xs text-cyan-700">Косинус</p>
                          </div>
                          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition-colors">
                            <div className="font-semibold text-cyan-900 mb-0.5 text-sm">
                              <MathFormula>
                                (tg x)' = <Frac num="1" den={<Pow base="cos" exp="2" />} />(x)
                              </MathFormula>
                            </div>
                            <p className="text-xs text-cyan-700">Тангенс</p>
                          </div>
                          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition-colors">
                            <div className="font-semibold text-cyan-900 mb-0.5 text-sm">
                              <MathFormula>
                                (ctg x)' = <Frac num="-1" den={<Pow base="sin" exp="2" />} />(x)
                              </MathFormula>
                            </div>
                            <p className="text-xs text-cyan-700">Котангенс</p>
                          </div>
                        </div>
                      </div>

                      {/* Показательные и логарифмы */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Показательные и логарифмы
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                            <div className="font-semibold text-orange-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Pow base="e" exp="x" />)' = <Pow base="e" exp="x" />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-orange-700">Экспонента</p>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                            <div className="font-semibold text-orange-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Pow base="a" exp="x" />)' = <Pow base="a" exp="x" />·ln(a)
                              </MathFormula>
                            </div>
                            <p className="text-xs text-orange-700">Показательная</p>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                            <div className="font-semibold text-orange-900 mb-0.5 text-sm">
                              <MathFormula>
                                (ln x)' = <Frac num="1" den="x" />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-orange-700">Натуральный логарифм</p>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                            <div className="font-semibold text-orange-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Sub base="log" subscript="a" /> x)' = <Frac num="1" den="x·ln(a)" />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-orange-700">Логарифм по основанию a</p>
                          </div>
                        </div>
                      </div>

                      {/* Обратные тригонометрические */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Обратные тригонометрические
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors">
                            <div className="font-semibold text-pink-900 mb-0.5 text-sm">
                              <MathFormula>
                                (arcsin x)' = <Frac num="1" den={<Sqrt>1-<Pow base="x" exp="2" /></Sqrt>} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-pink-700">Арксинус</p>
                          </div>
                          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors">
                            <div className="font-semibold text-pink-900 mb-0.5 text-sm">
                              <MathFormula>
                                (arccos x)' = <Frac num="-1" den={<Sqrt>1-<Pow base="x" exp="2" /></Sqrt>} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-pink-700">Арккосинус</p>
                          </div>
                          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors">
                            <div className="font-semibold text-pink-900 mb-0.5 text-sm">
                              <MathFormula>
                                (arctg x)' = <Frac num="1" den={<>(1+<Pow base="x" exp="2" />)</>} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-pink-700">Арктангенс</p>
                          </div>
                          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors">
                            <div className="font-semibold text-pink-900 mb-0.5 text-sm">
                              <MathFormula>
                                (arcctg x)' = <Frac num="-1" den={<>(1+<Pow base="x" exp="2" />)</>} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-pink-700">Арккотангенс</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка: Правила операций (sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <div className="p-5 rounded-2xl border-2 bg-white shadow-xl" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4 text-purple-600 border-b-2 border-purple-200 pb-2">
                      Правила дифференцирования
                    </h3>
                    
                    <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Правила операций */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Правила операций
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                            <div className="font-semibold text-purple-900 mb-0.5 text-sm">
                              <MathFormula>(f ± g)' = f' ± g'</MathFormula>
                            </div>
                            <p className="text-xs text-purple-700">Сумма/разность</p>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                            <div className="font-semibold text-purple-900 mb-0.5 text-sm">
                              <MathFormula>(f·g)' = f'·g + f·g'</MathFormula>
                            </div>
                            <p className="text-xs text-purple-700">Произведение</p>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                            <div className="font-semibold text-purple-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Frac num="f" den="g"/>)' = <Frac num="f'·g - f·g'" den={<Pow base="g" exp="2" />} />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-purple-700">Частное</p>
                          </div>
                        </div>
                      </div>

                      {/* Сложная функция */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Сложная функция
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                            <div className="font-semibold text-indigo-900 mb-0.5 text-sm">
                              <MathFormula>(f(g(x)))' = f'(g(x))·g'(x)</MathFormula>
                            </div>
                            <p className="text-xs text-indigo-700">Цепное правило</p>
                          </div>
                        </div>
                      </div>

                      {/* Константа */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Умножение на константу
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-900 mb-0.5 text-sm">
                              <MathFormula>(C·f)' = C·f'</MathFormula>
                            </div>
                            <p className="text-xs text-gray-700">Константа выносится</p>
                          </div>
                        </div>
                      </div>

                      {/* Дополнительные правила */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                          Дополнительные правила
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors">
                            <div className="font-semibold text-teal-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Pow base="f" exp="n" />)' = n·<Pow base="f" exp="n-1" />·f'
                              </MathFormula>
                            </div>
                            <p className="text-xs text-teal-700">Степень функции</p>
                          </div>
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors">
                            <div className="font-semibold text-teal-900 mb-0.5 text-sm">
                              <MathFormula>
                                (<Pow base="a" exp="f(x)" />)' = <Pow base="a" exp="f(x)" />·ln(a)·f'(x)
                              </MathFormula>
                            </div>
                            <p className="text-xs text-teal-700">Показательная от функции</p>
                          </div>
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors">
                            <div className="font-semibold text-teal-900 mb-0.5 text-sm">
                              <MathFormula>
                                (ln f(x))' = <Frac num="f'(x)" den="f(x)" />
                              </MathFormula>
                            </div>
                            <p className="text-xs text-teal-700">Логарифм функции</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка ИНТЕГРАЛЫ */}
          {activeTab === 'integrals' && (
            <>
              {/* Форма ввода для интегралов */}
              <div className="mb-12 max-w-4xl mx-auto">
                <div className="p-6 rounded-2xl border-2 shadow-lg" 
                  style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Sigma className="w-6 h-6 text-purple-600" />
                    Вычисление интеграла
                  </h2>

                  <form onSubmit={integralForm.handleSubmit(onSubmitIntegral)} className="space-y-6">
                    {/* Выбор типа интеграла */}
                    <div>
                      <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Тип интеграла
                      </label>
                      <div className="flex gap-4">
                        <label className="flex-1">
                          <input
                            type="radio"
                            {...integralForm.register('integralType')}
                            value="indefinite"
                            checked={integralType === 'indefinite'}
                            onChange={(e) => {
                              setIntegralType('indefinite');
                              integralForm.setValue('integralType', 'indefinite');
                              integralForm.setValue('lowerBound', undefined);
                              integralForm.setValue('upperBound', undefined);
                            }}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            integralType === 'indefinite'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-300 hover:border-purple-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                integralType === 'indefinite' ? 'border-purple-500' : 'border-gray-300'
                              }`}>
                                {integralType === 'indefinite' && (
                                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                                )}
                              </div>
                              <span className="font-semibold text-gray-900">Неопределённый интеграл</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-7">∫ f(x) dx = F(x) + C</p>
                          </div>
                        </label>

                        <label className="flex-1">
                          <input
                            type="radio"
                            {...integralForm.register('integralType')}
                            value="definite"
                            checked={integralType === 'definite'}
                            onChange={(e) => {
                              setIntegralType('definite');
                              integralForm.setValue('integralType', 'definite');
                            }}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            integralType === 'definite'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-300 hover:border-purple-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                integralType === 'definite' ? 'border-purple-500' : 'border-gray-300'
                              }`}>
                                {integralType === 'definite' && (
                                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                                )}
                              </div>
                              <span className="font-semibold text-gray-900">Определённый интеграл</span>
                            </div>
                            <div className="text-sm text-gray-600 ml-7 flex items-center gap-1">
                              <IntegralSymbol type="definite" size="small" />
                              <span>f(x) dx = F(b) - F(a)</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Функция */}
                    <div>
                      <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        Функция f(x)
                      </label>
                      <input
                        {...integralForm.register('expression')}
                        className="w-full px-4 py-3 rounded-lg border-2 text-lg font-mono transition-all focus:ring-2 focus:ring-purple-500"
                        style={{ borderColor: 'var(--border)' }}
                        placeholder="x^2"
                      />
                      {watchedIntegralExpr && (
                        <div className="mt-2 p-3 rounded-lg min-h-[2.5rem] flex items-center" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                          <span className="text-sm text-gray-500 mr-2">f(x) =</span>
                          <MathExpression expression={watchedIntegralExpr} className="text-xl" />
                        </div>
                      )}
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs font-semibold text-purple-900 mb-2">⚡ Быстрый выбор примеров:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { expr: 'x^2', label: 'x²' },
                            { expr: 'x^3', label: 'x³' },
                            { expr: 'sin(x)', label: 'sin(x)' },
                            { expr: 'cos(x)', label: 'cos(x)' },
                            { expr: 'exp(x)', label: 'eˣ' },
                            { expr: '1/x', label: '1/x' },
                            { expr: 'x * exp(x)', label: 'x·eˣ' },
                            { expr: 'sin(x) * cos(x)', label: 'sin·cos' },
                          ].map((example, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => integralForm.setValue('expression', example.expr)}
                              className="px-3 py-1.5 bg-white border-2 border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all hover:scale-105"
                            >
                              {example.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {integralForm.formState.errors.expression && (
                        <p className="mt-1 text-sm text-red-600">{integralForm.formState.errors.expression.message}</p>
                      )}
                    </div>

                    <div className={`grid ${integralType === 'definite' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                      {/* Переменная */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                          Переменная интегрирования
                        </label>
                        <input
                          {...integralForm.register('variable')}
                          className="w-full px-4 py-2 rounded-lg border-2"
                          style={{ borderColor: 'var(--border)' }}
                          placeholder="x"
                        />
                      </div>

                      {/* Пределы - только для определённого интеграла */}
                      {integralType === 'definite' && (
                        <>
                          {/* Нижний предел */}
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                              Нижний предел (a) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="any"
                              {...integralForm.register('lowerBound', { valueAsNumber: true })}
                              className="w-full px-4 py-2 rounded-lg border-2"
                              style={{ borderColor: 'var(--border)' }}
                              placeholder="0"
                            />
                            {integralForm.formState.errors.lowerBound && (
                              <p className="mt-1 text-xs text-red-600">{integralForm.formState.errors.lowerBound.message}</p>
                            )}
                          </div>

                          {/* Верхний предел */}
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                              Верхний предел (b) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="any"
                              {...integralForm.register('upperBound', { valueAsNumber: true })}
                              className="w-full px-4 py-2 rounded-lg border-2"
                              style={{ borderColor: 'var(--border)' }}
                              placeholder="1"
                            />
                            {integralForm.formState.errors.upperBound && (
                              <p className="mt-1 text-xs text-red-600">{integralForm.formState.errors.upperBound.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Подсказка для неопределённого интеграла */}
                    {integralType === 'indefinite' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">💡 Неопределённый интеграл:</span> Результат будет содержать константу интегрирования C
                        </p>
                      </div>
                    )}

                    {/* Подсказка для определённого интеграла */}
                    {integralType === 'definite' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-900 flex items-center gap-2">
                          <span className="font-semibold">📊 Определённый интеграл:</span> 
                          <span>Результат будет числом - площадь под графиком от a до b</span>
                        </p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      loading={isLoading} 
                      disabled={isLoading}
                      className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-white"
                    >
                      {isLoading 
                        ? '⏳ Вычисляю...' 
                        : integralType === 'indefinite'
                          ? '∫ Найти первообразную'
                          : (
                            <span className="flex items-center justify-center gap-2">
                              <IntegralSymbol type="definite" size="medium" />
                              <span>Вычислить определённый интеграл</span>
                            </span>
                          )
                      }
                    </Button>
                  </form>
                </div>
              </div>

              {/* Результаты интеграла */}
              {integralResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-4xl mx-auto mb-12"
                >
                  <div className="p-8 rounded-2xl border-2 shadow-xl"
                    style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      <Sigma className="w-6 h-6 text-purple-600" />
                      Результат интегрирования
                    </h2>

                    {/* Результат */}
                    <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                      <h3 className="text-lg font-semibold mb-3 text-purple-900 flex items-center gap-2">
                        {integralType === 'indefinite' ? (
                          <>
                            <IntegralSymbol type="indefinite" size="medium" />
                            <span>Первообразная:</span>
                          </>
                        ) : (
                          <>
                            <IntegralSymbol type="definite" size="medium" />
                            <span>Численное значение:</span>
                          </>
                        )}
                      </h3>
                      <div className="text-3xl font-bold text-purple-900">
                        <MathExpression expression={integralResult.result} className="font-mono" />
                      </div>
                    </div>

                    {/* Пошаговое решение */}
                    {integralResult.steps && integralResult.steps.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                          📝 Пошаговое решение:
                        </h3>
                        <div className="space-y-3">
                          {integralResult.steps.map((step: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-lg bg-white border-2 border-gray-200"
                            >
                              <p className="text-gray-700">
                                <MathExpression expression={step} />
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LaTeX формула */}
                    {integralResult.latex && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">LaTeX формула:</p>
                        <code className="text-sm font-mono text-gray-700">{integralResult.latex}</code>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Инструкция для интегралов */}
              <div className="max-w-4xl mx-auto mt-8">
                <StepGuide 
                  title="Как вычислить интеграл"
                  description="Следуйте этим простым шагам"
                  steps={[
                    {
                      id: 'int-step1',
                      title: 'Выберите тип интеграла',
                      description: 'Определите, какой интеграл вам нужен.',
                      content: (
                        <div className="text-sm space-y-2">
                          <p><strong>Неопределённый:</strong> ∫ f(x) dx = F(x) + C - первообразная с константой</p>
                          <p><strong>Определённый:</strong> ∫ᵇₐ f(x) dx = F(b) - F(a) - число (площадь)</p>
                        </div>
                      ),
                    },
                    {
                      id: 'int-step2',
                      title: 'Введите подынтегральную функцию',
                      description: 'Напишите функцию, которую нужно проинтегрировать.',
                      content: (
                        <div className="text-sm">
                          <p>Поддерживаются: степенные (x^n), тригонометрические (sin, cos), показательные (exp), логарифмические (log) функции</p>
                        </div>
                      ),
                    },
                    {
                      id: 'int-step3',
                      title: 'Укажите переменную и пределы',
                      description: 'Задайте переменную интегрирования (обычно x). Для определённого интеграла укажите нижний и верхний пределы.',
                      content: (
                        <div className="text-sm">
                          <p>Пример: для вычисления площади от 0 до 1 укажите a = 0, b = 1</p>
                        </div>
                      ),
                    },
                    {
                      id: 'int-step4',
                      title: 'Получите решение',
                      description: 'Нажмите кнопку и увидите результат с пошаговым решением и визуализацией.',
                      content: (
                        <div className="text-sm">
                          <p>Результат включает: первообразную, пошаговое решение, график и численное значение (для определённого)</p>
                        </div>
                      ),
                    },
                  ]}
                />
          </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default CalculusPage;
