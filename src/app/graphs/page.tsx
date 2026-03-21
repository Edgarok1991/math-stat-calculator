'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedResult } from '@/components/UI/AnimatedResult';
import { FractionDisplay } from '@/components/UI';
import { decimalToFraction } from '@/lib/decimalToFraction';
import { LineChart, Box, BarChart3, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

// Динамический импорт Plotly для избежания SSR
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--gold)' }}></div>
        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Загрузка графика...</p>
      </div>
    </div>
  )
});

// Схемы валидации
const dataGraphSchema = z.object({
  data: z.string().min(1, 'Введите данные'),
  graphType: z.enum(['boxplot', 'scatter', 'interval', 'histogram']),
});

const function2DSchema = z.object({
  expression: z.string().min(1, 'Введите функцию'),
  xMin: z.number(),
  xMax: z.number(),
});

const function3DSchema = z.object({
  expression: z.string().min(1, 'Введите функцию'),
  xMin: z.number(),
  xMax: z.number(),
  yMin: z.number(),
  yMax: z.number(),
});

type DataGraphFormData = z.infer<typeof dataGraphSchema>;
type Function2DFormData = z.infer<typeof function2DSchema>;
type Function3DFormData = z.infer<typeof function3DSchema>;

// Интерфейсы
interface StatisticsResult {
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
  histogram: Array<{ range: [number, number]; count: number; frequency: number }>;
  sortedData: number[];
}

interface Graph2DResult {
  points: Array<{ x: number; y: number }>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface Graph3DResult {
  points: Array<{ x: number; y: number; z: number }>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

const graphTypes = [
  // Статистические графики
  { value: 'boxplot', label: ' Box Plot (Ящик с усами)', description: 'Распределение с квартилями и выбросами' },
  { value: 'violin', label: ' Violin Plot (Скрипичная диаграмма)', description: 'Box Plot + плотность распределения' },
  { value: 'scatter', label: ' Точечный график', description: 'Все точки данных с трендом' },
  { value: 'histogram', label: ' Гистограмма', description: 'Распределение частот по интервалам' },
  { value: 'density', label: ' Density Plot (График плотности)', description: 'Сглаженное распределение вероятности' },
  { value: 'interval', label: ' Интервальный график', description: 'Вертикальное представление диапазона' },
  { value: 'qqplot', label: ' Q-Q Plot', description: 'Проверка нормальности распределения' },
  { value: 'cumulative', label: ' Cumulative Distribution', description: 'Кумулятивная функция распределения' },
  { value: 'heatmap', label: ' Heatmap (Тепловая карта)', description: 'Корреляционная матрица данных' },
  { value: 'radar', label: ' Radar Chart', description: 'Многомерное сравнение данных' },
  
  // Математические графики
  { value: 'function2d', label: ' 2D График функции', description: 'График y = f(x)' },
  { value: 'function3d', label: ' 3D График функции', description: 'График z = f(x,y)' },
  { value: 'contour', label: ' Contour Plot', description: '2D представление 3D функции (линии уровня)' },
  { value: 'polar', label: ' Polar Plot', description: 'График в полярных координатах r = f(θ)' },
];

function GraphsPage() {
  const { token } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('boxplot');
  const [dataResult, setDataResult] = useState<StatisticsResult | null>(null);
  const [result2D, setResult2D] = useState<Graph2DResult | null>(null);
  const [result3D, setResult3D] = useState<Graph3DResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние для 3D управления
  const [rotation3D, setRotation3D] = useState({ x: 30, y: 45 }); // Углы в градусах
  const [zoom3D, setZoom3D] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const dataForm = useForm<DataGraphFormData>({
    resolver: zodResolver(dataGraphSchema),
    defaultValues: {
      data: '12, 15, 18, 20, 22, 25, 28, 50, 100',
      graphType: 'boxplot',
    },
  });

  const function2DForm = useForm<Function2DFormData>({
    resolver: zodResolver(function2DSchema),
    defaultValues: {
      expression: 'x^2',
      xMin: -10,
      xMax: 10,
    },
  });

  const function3DForm = useForm<Function3DFormData>({
    resolver: zodResolver(function3DSchema),
    defaultValues: {
      expression: 'x^2 + y^2',
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
    },
  });

  const parseData = (str: string): number[] => {
    return str.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  };

  const onSubmitData = async (data: DataGraphFormData) => {
    setIsLoading(true);
    try {
      const numericData = parseData(data.data);
      
      if (numericData.length < 2) {
        throw new Error('Необходимо минимум 2 значения');
      }

      const calcResult = await apiService.calculateDescriptiveStatistics(numericData);
      setDataResult(calcResult);
      if (token) {
        apiService.saveToHistory(token, { type: 'statistics', input: { data: numericData, graphType: data.graphType }, result: calcResult }).catch(() => {});
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при обработке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit2D = async (data: Function2DFormData) => {
    setIsLoading(true);
    try {
      const calcResult = await apiService.calculate2DGraph(data);
      setResult2D(calcResult);
      if (token) {
        apiService.saveToHistory(token, { type: 'graph2d', input: data, result: calcResult }).catch(() => {});
      }
    } catch (error) {
      console.error('Error calculating 2D graph:', error);
      alert('Ошибка при построении 2D графика. Проверьте правильность функции.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit3D = async (data: Function3DFormData) => {
    setIsLoading(true);
    try {
      const calcResult = await apiService.calculate3DGraph(data);
      setResult3D(calcResult);
      setRotation3D({ x: 30, y: 45 });
      setZoom3D(1);
      if (token) {
        apiService.saveToHistory(token, { type: 'graph3d', input: data, result: calcResult }).catch(() => {});
      }
    } catch (error) {
      console.error('Error calculating 3D graph:', error);
      alert('Ошибка при построении 3D графика. Проверьте правильность функции.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчики для 3D графика
  const handle3DWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom3D(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const handle3DMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handle3DMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setRotation3D(prev => ({
      x: (prev.x + deltaY * 0.5) % 360,
      y: (prev.y + deltaX * 0.5) % 360,
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handle3DMouseUp = () => {
    setIsDragging(false);
  };

  const reset3DView = () => {
    setRotation3D({ x: 30, y: 45 });
    setZoom3D(1);
  };

  const renderGraph = () => {
    if (selectedType === 'function2d' && result2D) {
      return (
        <AnimatedResult type="success" title="2D График функции">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--gold)' }}>График y = f(x)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Что это за график?</h4>
              <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                <strong>2D График функции</strong> — это классическое представление функции одной переменной y = f(x) 
                в декартовой системе координат. График строится путём вычисления значений функции для множества точек x 
                и соединения их плавной линией. Это фундаментальный инструмент математического анализа.
              </p>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Для чего нужен?</h4>
              <ul className="text-sm space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Визуализация функций:</strong> Понять поведение функции на интервале</li>
                <li><strong>Поиск экстремумов:</strong> Найти максимумы и минимумы (вершины, впадины)</li>
                <li><strong>Анализ роста/убывания:</strong> Увидеть, где функция растёт или убывает</li>
                <li><strong>Нули функции:</strong> Точки пересечения с осью X (корни уравнения f(x)=0)</li>
                <li><strong>Изучение свойств:</strong> Непрерывность, асимптоты, периодичность</li>
                <li><strong>Решение уравнений:</strong> Графический метод поиска корней</li>
              </ul>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Как интерпретировать?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Ось X:</strong> Независимая переменная (аргумент функции)</li>
                <li><strong>Ось Y:</strong> Зависимая переменная (значение функции)</li>
                <li><strong>Линия идёт вверх:</strong> Функция возрастает</li>
                <li><strong>Линия идёт вниз:</strong> Функция убывает</li>
                <li><strong>Горизонтальный участок:</strong> Функция постоянна</li>
                <li><strong>Вертикальные асимптоты:</strong> Разрывы функции (например, при делении на ноль)</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: result2D.points.map(p => p.x),
                  y: result2D.points.map(p => p.y),
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#6366f1',
                    width: 3,
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 500,
                title: {
                  text: 'Интерактивный 2D график',
                  font: { size: 18, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'X' },
                  gridcolor: '#e2e8f0',
                  zeroline: true,
                  zerolinecolor: '#94a3b8',
                },
                yaxis: {
                  title: { text: 'Y' },
                  gridcolor: '#e2e8f0',
                  zeroline: true,
                  zerolinecolor: '#94a3b8',
                },
                hovermode: 'closest',
                plot_bgcolor: '#f8fafc',
                paper_bgcolor: 'white',
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'график_2d',
                  height: 800,
                  width: 1200,
                },
              }}
              style={{ width: '100%' }}
            />
            
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Возможности:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                <p> Приближение области</p>
                <p> Панорамирование</p>
                <p> Сброс вида</p>
                <p> Скачать как PNG</p>
                <p> Наведите для значений</p>
                <p> Автомасштабирование</p>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    if (selectedType === 'function3d' && result3D) {
      return (
        <AnimatedResult type="success" title="3D График функции">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 ">График z = f(x, y)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Что это за график?</h4>
              <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                <strong>3D График функции</strong> — это трёхмерная визуализация функции двух переменных z = f(x,y). 
                График представляет собой поверхность в трёхмерном пространстве, где каждая точка (x,y) имеет соответствующую 
                высоту z. Цветовая шкала (Viridis) помогает визуально различать высоты поверхности.
              </p>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Для чего нужен?</h4>
              <ul className="text-sm space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Визуализация поверхностей:</strong> Понять форму функции двух переменных</li>
                <li><strong>Поиск экстремумов:</strong> Найти максимумы и минимумы функции (пики и впадины)</li>
                <li><strong>Седловые точки:</strong> Обнаружить точки, которые не являются ни максимумом, ни минимумом</li>
                <li><strong>Оптимизация:</strong> Визуализировать целевые функции в задачах оптимизации</li>
                <li><strong>Машинное обучение:</strong> Графики функций потерь (loss landscape)</li>
                <li><strong>Физика:</strong> Визуализация потенциалов, температурных полей</li>
              </ul>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Как интерпретировать?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Оси X и Y:</strong> Независимые переменные (аргументы функции)</li>
                <li><strong>Ось Z:</strong> Зависимая переменная (значение функции)</li>
                <li><strong>Цвет точек:</strong> Темнее = меньшее значение z, Светлее = большее z</li>
                <li><strong>Пики (вершины):</strong> Локальные или глобальные максимумы</li>
                <li><strong>Впадины (долины):</strong> Локальные или глобальные минимумы</li>
                <li><strong>Седло:</strong> Точка, где в одном направлении максимум, в другом — минимум</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: result3D.points.map(p => p.x),
                  y: result3D.points.map(p => p.y),
                  z: result3D.points.map(p => p.z),
                  type: 'scatter3d',
                  mode: 'markers',
                  marker: {
                    size: 3,
                    color: result3D.points.map(p => p.z),
                    colorscale: 'Viridis',
                    showscale: true,
                    colorbar: {
                      title: { text: 'Z' },
                      thickness: 15,
                      len: 0.7,
                    },
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 700,
                title: {
                  text: 'Интерактивный 3D график',
                  font: { size: 18, color: '#1e293b' }
                },
                scene: {
                  xaxis: { title: { text: 'X' }, gridcolor: '#e2e8f0', backgroundcolor: '#f8fafc' },
                  yaxis: { title: { text: 'Y' }, gridcolor: '#e2e8f0', backgroundcolor: '#f8fafc' },
                  zaxis: { title: { text: 'Z' }, gridcolor: '#e2e8f0', backgroundcolor: '#f8fafc' },
                  camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.3 },
                  },
                },
                paper_bgcolor: 'white',
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'график_3d',
                  height: 1000,
                  width: 1200,
                },
              }}
              style={{ width: '100%' }}
            />

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}> Вращение</p>
                <p className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>Зажмите и перетаскивайте мышью для вращения в любом направлении</p>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}> Масштаб</p>
                <p className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>Колесо мыши для масштабирования</p>
              </div>
              <div className="p-4 rounded-lg border border-[#D4AF37]/50 bg-[rgba(212,175,55,0.08)]">
                <p className="text-sm font-semibold text-[#d4c4a0] mb-1"> Экспорт</p>
                <p className="text-xs ">Кнопка камеры для сохранения как PNG</p>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Contour Plot (Контурный график)
    if (selectedType === 'contour' && result3D) {
      return (
        <AnimatedResult type="success" title="Contour Plot (Контурный график)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 "> Contour Plot (Линии уровня)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm  mb-3">
                <strong>Контурный график (Contour Plot)</strong> — это 2D представление 3D функции z = f(x,y), 
                где линии (контуры) соединяют точки с одинаковым значением z. Похоже на топографическую карту местности, 
                где линии показывают одинаковую высоту.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm  space-y-1 mb-3 list-disc list-inside">
                <li><strong>Поиск экстремумов:</strong> Легко находить максимумы и минимумы функции</li>
                <li><strong>Градиенты:</strong> Плотные линии = крутой склон (большой градиент)</li>
                <li><strong>Оптимизация:</strong> Визуализация функций потерь в машинном обучении</li>
                <li><strong>Физика/инженерия:</strong> Тепловые карты, потенциальные поля, аэродинамика</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как читать график?</h4>
              <ul className="text-sm  space-y-1 list-disc list-inside">
                <li><strong>Каждая линия:</strong> Точки с одинаковым значением z</li>
                <li><strong>Цвет:</strong> Показывает величину z (темнее/светлее)</li>
                <li><strong>Близкие линии:</strong> Быстрое изменение функции</li>
                <li><strong>Замкнутые контуры:</strong> Локальные максимумы или минимумы</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: result3D.points.map(p => p.x),
                  y: result3D.points.map(p => p.y),
                  z: result3D.points.map(p => p.z),
                  type: 'contour',
                  colorscale: 'Viridis',
                  contours: {
                    coloring: 'heatmap',
                    showlabels: true,
                    labelfont: {
                      size: 10,
                      color: 'white',
                    },
                  },
                  colorbar: {
                    title: { text: 'Z', side: 'right' },
                    thickness: 20,
                    len: 0.7,
                  },
                  hovertemplate: 'X: %{x:.2f}<br>Y: %{y:.2f}<br>Z: %{z:.2f}<extra></extra>',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 600,
                title: {
                  text: 'Контурный график функции z = f(x,y)',
                  font: { size: 20, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'X', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                yaxis: {
                  title: { text: 'Y', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'contour_plot',
                  width: 1200,
                  height: 900,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Применение */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Практическое применение:</h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm ">
                <div>
                  <p><strong className=""> ML/AI:</strong> Визуализация функции потерь, градиентный спуск</p>
                </div>
                <div>
                  <p><strong className="text-[#c9a227]"> Физика:</strong> Температурные поля, электрические потенциалы</p>
                </div>
                <div>
                  <p><strong className=""> Математика:</strong> Поиск седловых точек, анализ функций</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Polar Plot (Полярный график)
    if (selectedType === 'polar' && result2D) {
      // Преобразуем декартовы координаты в полярные для визуализации
      const polarData = result2D.points.map(point => {
        // Используем x как угол θ (в радианах), y как радиус r
        const theta = point.x;
        const r = Math.abs(point.y); // радиус всегда положительный
        return { theta, r };
      });
      
      return (
        <AnimatedResult type="success" title="Polar Plot (Полярный график)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-[#D4AF37]"> Polar Plot (График в полярных координатах)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Полярный график (Polar Plot)</strong> — это способ представления функции в полярных координатах r = f(θ), 
                где r — расстояние от центра, θ — угол. Используется для функций с круговой симметрией.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Периодические функции:</strong> sin, cos и их комбинации красиво отображаются</li>
                <li><strong>Розы и спирали:</strong> r = sin(nθ), r = aθ создают красивые узоры</li>
                <li><strong>Антенны:</strong> Диаграммы направленности излучения</li>
                <li><strong>Навигация:</strong> Компасные розы, радары</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Примеры функций:</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>r = sin(3θ):</strong> Роза с 3 лепестками</li>
                <li><strong>r = 1 + cos(θ):</strong> Кардиоида (форма сердца)</li>
                <li><strong>r = θ:</strong> Спираль Архимеда</li>
                <li><strong>r = e^(θ/10):</strong> Логарифмическая спираль</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  type: 'scatterpolar',
                  r: polarData.map(p => p.r),
                  theta: polarData.map(p => p.theta * 180 / Math.PI), // Преобразуем радианы в градусы
                  mode: 'lines',
                  line: {
                    color: '#0ea5e9',
                    width: 3,
                  },
                  fill: 'toself',
                  fillcolor: 'rgba(14, 165, 233, 0.1)',
                  name: 'r = f(θ)',
                  hovertemplate: 'θ: %{theta:.1f}°<br>r: %{r:.2f}<extra></extra>',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 650,
                title: {
                  text: 'Полярный график r = f(θ)',
                  font: { size: 20, color: '#1e293b' }
                },
                polar: {
                  radialaxis: {
                    visible: true,
                    gridcolor: '#e2e8f0',
                  },
                  angularaxis: {
                    gridcolor: '#e2e8f0',
                    direction: 'counterclockwise',
                  },
                  bgcolor: '#fafafa',
                },
                paper_bgcolor: 'white',
                showlegend: false,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'polar_plot',
                  width: 1000,
                  height: 1000,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Примеры */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Попробуйте эти функции:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-[#57534e]">
                <div className="space-y-1">
                  <p><code className="bg-[rgba(212,175,55,0.08)] px-2 py-1 rounded">sin(3*x)</code> - Роза с 3 лепестками</p>
                  <p><code className="bg-[rgba(212,175,55,0.08)] px-2 py-1 rounded">1 + cos(x)</code> - Кардиоида</p>
                </div>
                <div className="space-y-1">
                  <p><code className="bg-[rgba(212,175,55,0.08)] px-2 py-1 rounded">x/2</code> - Спираль Архимеда</p>
                  <p><code className="bg-[rgba(212,175,55,0.08)] px-2 py-1 rounded">e^(x/10)</code> - Логарифм. спираль</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#D4AF37]"> Совет: В 2D графике используйте x как угол θ (от -π до π или -10 до 10)</p>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    if (!dataResult) return null;

    // Box Plot классический стиль
    if (selectedType === 'boxplot') {
      return (
        <AnimatedResult type="info" title="Box Plot (Ящик с усами)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4  flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Диаграмма размаха (Box Plot)
            </h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Что это за график?</h4>
              <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                <strong>Box Plot (Диаграмма размаха)</strong> — это стандартизированный способ отображения распределения данных 
                на основе пяти ключевых показателей: минимум, первый квартиль (Q1), медиана, третий квартиль (Q3) и максимум. 
                "Ящик" показывает средние 50% данных (от Q1 до Q3), а "усы" простираются до минимума и максимума.
              </p>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Для чего нужен?</h4>
              <ul className="text-sm space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Визуализация разброса:</strong> Быстро оценить, как распределены данные</li>
                <li><strong>Обнаружение выбросов:</strong> Точки за пределами усов — это выбросы</li>
                <li><strong>Сравнение групп:</strong> Можно разместить несколько box plot рядом для сравнения</li>
                <li><strong>Оценка симметрии:</strong> Положение медианы относительно Q1 и Q3 показывает асимметрию</li>
                <li><strong>Проверка данных:</strong> Перед статистическими тестами (t-test, ANOVA)</li>
              </ul>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Как интерпретировать?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Ящик (IQR):</strong> В нём находится 50% всех данных (от 25% до 75%)</li>
                <li><strong>Линия внутри ящика:</strong> Медиана (50-й процентиль)</li>
                <li><strong>Усы:</strong> Простираются до min/max или до 1.5×IQR от квартилей</li>
                <li><strong>Точки за усами:</strong> Выбросы, требующие внимания</li>
                <li><strong>Узкий ящик:</strong> Данные сконцентрированы (малая вариация)</li>
                <li><strong>Широкий ящик:</strong> Большой разброс данных</li>
              </ul>
            </div>
            
            {/* Горизонтальный Box Plot */}
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: dataResult.sortedData,
                  type: 'box',
                  orientation: 'h',
                  name: '',
                  marker: {
                    color: '#6366f1',
                    size: 8,
                  },
                  line: {
                    color: '#4f46e5',
                    width: 3,
                  },
                  fillcolor: 'rgba(99, 102, 241, 0.15)',
                  boxpoints: 'all',
                  jitter: 0.5,
                  pointpos: -2,
                  whiskerwidth: 0.8,
                  hoveron: 'boxes+points',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 500,
                title: {
                  text: 'Box and Whisker Plot (Ящик с усами)',
                  font: { size: 22, color: '#1e293b', family: 'Arial, sans-serif' }
                },
                xaxis: {
                  title: { text: 'Значения', font: { size: 16, color: '#334155' } },
                  gridcolor: '#e2e8f0',
                  showgrid: true,
                  zeroline: false,
                },
                yaxis: {
                  showticklabels: false,
                  showgrid: false,
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
                showlegend: false,
                margin: { l: 60, r: 200, t: 100, b: 80 },
                annotations: [
                  // Minimum
                  {
                    x: dataResult.min,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `Min<br>${decimalToFraction(dataResult.min, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: '#10b981',
                    ax: 0,
                    ay: -80,
                    font: { size: 12, color: '#10b981', family: 'Arial' },
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    bordercolor: '#10b981',
                    borderwidth: 1,
                    borderpad: 4,
                  },
                  // Q1
                  {
                    x: dataResult.q1,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `Q1<br>${decimalToFraction(dataResult.q1, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: '#6366f1',
                    ax: 0,
                    ay: 80,
                    font: { size: 12, color: '#6366f1', family: 'Arial' },
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    bordercolor: '#6366f1',
                    borderwidth: 1,
                    borderpad: 4,
                  },
                  // Median
                  {
                    x: dataResult.median,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `Медиана<br>${decimalToFraction(dataResult.median, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 3,
                    arrowcolor: '#3b82f6',
                    ax: 0,
                    ay: -120,
                    font: { size: 13, color: '#3b82f6', family: 'Arial', weight: 'bold' },
                    bgcolor: 'rgba(59, 130, 246, 0.15)',
                    bordercolor: '#3b82f6',
                    borderwidth: 2,
                    borderpad: 6,
                  },
                  // Q3
                  {
                    x: dataResult.q3,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `Q3<br>${decimalToFraction(dataResult.q3, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: '#6366f1',
                    ax: 0,
                    ay: 80,
                    font: { size: 12, color: '#6366f1', family: 'Arial' },
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    bordercolor: '#6366f1',
                    borderwidth: 1,
                    borderpad: 4,
                  },
                  // Maximum
                  {
                    x: dataResult.max,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `Max<br>${decimalToFraction(dataResult.max, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: '#10b981',
                    ax: 0,
                    ay: -80,
                    font: { size: 12, color: '#10b981', family: 'Arial' },
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    bordercolor: '#10b981',
                    borderwidth: 1,
                    borderpad: 4,
                  },
                  // IQR Label
                  {
                    x: (dataResult.q1 + dataResult.q3) / 2,
                    y: 0,
                    xref: 'x',
                    yref: 'y',
                    text: `IQR = ${decimalToFraction(dataResult.iqr, 2)}`,
                    showarrow: false,
                    font: { size: 11, color: '#6366f1', family: 'Arial', weight: 'bold' },
                    bgcolor: 'rgba(99, 102, 241, 0.2)',
                    bordercolor: '#6366f1',
                    borderwidth: 1,
                    borderpad: 3,
                    yshift: 35,
                  },
                ] as any,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'boxplot_диаграмма',
                  width: 1400,
                  height: 800,
                },
              }}
              style={{ width: '100%' }}
            />

            {/* Легенда элементов */}
            <div className="mt-8 p-5 rounded-xl border-2" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
              <h4 className="text-lg font-bold  mb-4"> Элементы диаграммы:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3 p-2 card-midnight rounded-lg">
                  <div className="w-12 h-0.5 0"></div>
                  <span><strong className="">Усы (Whiskers):</strong> от Min до Max</span>
                </div>
                <div className="flex items-center gap-3 p-2 card-midnight rounded-lg">
                  <div className="w-12 h-8  border-2 border-[#D4AF37]"></div>
                  <span><strong className="">Ящик (Box):</strong> от Q1 до Q3 (IQR)</span>
                </div>
                <div className="flex items-center gap-3 p-2 card-midnight rounded-lg">
                  <div className="w-12 h-0.5 bg-[#D4AF37]"></div>
                  <span><strong className="">Медиана:</strong> центральное значение</span>
                </div>
                <div className="flex items-center gap-3 p-2 card-midnight rounded-lg">
                  <div className="w-3 h-3 rounded-full 0"></div>
                  <span><strong className="">Точки:</strong> все значения данных</span>
                </div>
              </div>
            </div>

            {/* Статистические показатели */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Минимум</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.min} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Q1 (25%)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q1} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Медиана (50%)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.median} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Q3 (75%)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q3} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Максимум</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.max} decimals={2} /></p>
              </div>
            </div>

            {dataResult.outliers.length > 0 && (
              <div className="mt-4 p-4  rounded-lg border-2 ">
                <h4 className="text-sm font-semibold  mb-2">
                  Выбросы (Outliers): {dataResult.outliers.length}
                </h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dataResult.outliers.map((outlier, i) => (
                    <span key={i} className="px-3 py-1   rounded-full text-sm font-medium border ">
                      <FractionDisplay value={outlier} decimals={3} className="inline" />
                    </span>
                  ))}
                </div>
                <p className="text-xs   p-2 rounded">
                  <strong>Границы выбросов:</strong> Нижняя: <FractionDisplay value={dataResult.lowerFence} decimals={2} className="inline" /> | Верхняя: <FractionDisplay value={dataResult.upperFence} decimals={2} className="inline" />
                </p>
              </div>
            )}
          </div>
        </AnimatedResult>
      );
    }

    // Гистограмма с Plotly
    if (selectedType === 'histogram') {
      return (
        <AnimatedResult type="info" title="Гистограмма распределения">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-4 "> Гистограмма частот</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Что это за график?</h4>
              <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                <strong>Гистограмма</strong> — это столбчатая диаграмма, показывающая распределение частот количественных данных. 
                Ось X разбита на интервалы (bins), а высота столбца показывает, сколько значений попало в каждый интервал. 
                В отличие от обычной столбчатой диаграммы, столбцы гистограммы обычно примыкают друг к другу без зазоров.
              </p>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Для чего нужен?</h4>
              <ul className="text-sm space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Визуализация распределения:</strong> Понять, как распределены данные (нормальное, скошенное, равномерное)</li>
                <li><strong>Поиск центра:</strong> Увидеть, где находится "пик" данных (мода)</li>
                <li><strong>Оценка разброса:</strong> Понять, насколько данные разбросаны</li>
                <li><strong>Выявление паттернов:</strong> Обнаружить бимодальность (два пика) или мультимодальность</li>
                <li><strong>Проверка перед анализом:</strong> Перед применением параметрических тестов</li>
              </ul>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Как интерпретировать?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Высокие столбцы:</strong> В этом диапазоне много значений</li>
                <li><strong>Низкие столбцы:</strong> Мало значений в этом диапазоне</li>
                <li><strong>Симметричная форма:</strong> Может указывать на нормальное распределение</li>
                <li><strong>Правый хвост длиннее:</strong> Положительная асимметрия (есть большие выбросы)</li>
                <li><strong>Левый хвост длиннее:</strong> Отрицательная асимметрия (есть малые выбросы)</li>
                <li><strong>Несколько пиков:</strong> Возможно, в данных есть разные группы</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: dataResult.sortedData,
                  type: 'histogram',
                  marker: {
                    color: '#a78bfa',
                    line: {
                      color: '#7c3aed',
                      width: 1,
                    },
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 500,
                title: {
                  text: 'Интерактивная гистограмма',
                  font: { size: 18, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Значения' },
                  gridcolor: '#e2e8f0',
                },
                yaxis: {
                  title: { text: 'Частота' },
                  gridcolor: '#e2e8f0',
                },
                plot_bgcolor: '#f8fafc',
                paper_bgcolor: 'white',
                showlegend: false,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'гистограмма',
                },
              }}
              style={{ width: '100%' }}
            />
          </div>
        </AnimatedResult>
      );
    }

    // Точечный график с Plotly
    if (selectedType === 'scatter') {
      return (
        <AnimatedResult type="info" title="Точечный график">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-4 text-[#D4AF37]"> Точечная диаграмма</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Точечная диаграмма (Scatter Plot)</strong> — это график, где каждое наблюдение представлено отдельной точкой. 
                Для одномерных данных по оси X обычно показывают порядковый номер (индекс) или ранг значения, а по оси Y — само значение. 
                Этот график помогает увидеть каждое значение и его положение относительно центральных тенденций.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Визуализация всех точек:</strong> Каждое значение видно на графике</li>
                <li><strong>Обнаружение выбросов:</strong> Точки, далекие от основной группы, легко заметить</li>
                <li><strong>Оценка трендов:</strong> Линии среднего и медианы показывают центр данных</li>
                <li><strong>Проверка паттернов:</strong> Увидеть кластеры или группы данных</li>
                <li><strong>Малые выборки:</strong> Когда важно видеть каждое значение (n &lt; 30)</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как интерпретировать?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>Циан точки:</strong> Обычные данные (в пределах нормы)</li>
                <li><strong>Красные крестики:</strong> Выбросы (за пределами 1.5×IQR)</li>
                <li><strong>Красная пунктирная линия:</strong> Среднее значение (μ)</li>
                <li><strong>Синяя пунктирная линия:</strong> Медиана (50-й процентиль)</li>
                <li><strong>Плотное облако точек:</strong> Малый разброс данных</li>
                <li><strong>Разреженные точки:</strong> Большая вариация данных</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  x: dataResult.sortedData
                    .map((val, idx) => idx)
                    .filter((_, idx) => !dataResult.outliers.includes(dataResult.sortedData[idx])),
                  y: dataResult.sortedData.filter(val => !dataResult.outliers.includes(val)),
                  type: 'scatter',
                  mode: 'markers',
                  marker: {
                    color: '#06b6d4',
                    size: 8,
                  },
                  name: 'Обычные данные',
                } as any,
                {
                  x: dataResult.sortedData
                    .map((val, idx) => idx)
                    .filter((_, idx) => dataResult.outliers.includes(dataResult.sortedData[idx])),
                  y: dataResult.outliers,
                  type: 'scatter',
                  mode: 'markers',
                  marker: {
                    color: '#ef4444',
                    size: 10,
                    symbol: 'x',
                  },
                  name: 'Выбросы',
                } as any,
                {
                  x: [0, dataResult.count - 1],
                  y: [dataResult.mean, dataResult.mean],
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#ef4444',
                    width: 2,
                    dash: 'dash',
                  },
                  name: 'Среднее',
                } as any,
                {
                  x: [0, dataResult.count - 1],
                  y: [dataResult.median, dataResult.median],
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#6366f1',
                    width: 2,
                    dash: 'dash',
                  },
                  name: 'Медиана',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 500,
                title: {
                  text: 'Интерактивный точечный график',
                  font: { size: 18, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Индекс (отсортированные данные)' },
                  gridcolor: '#e2e8f0',
                },
                yaxis: {
                  title: { text: 'Значения' },
                  gridcolor: '#e2e8f0',
                },
                plot_bgcolor: '#f8fafc',
                paper_bgcolor: 'white',
                hovermode: 'closest',
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'точечный_график',
                },
              }}
              style={{ width: '100%' }}
            />
          </div>
        </AnimatedResult>
      );
    }

    // Интервальный график
    if (selectedType === 'interval') {
      const categories = ['Данные'];
      const intervals = [
        { label: 'Min-Max', y0: dataResult.min, y1: dataResult.max, color: '#10b981' },
        { label: 'Q1-Q3 (IQR)', y0: dataResult.q1, y1: dataResult.q3, color: '#6366f1' },
      ];

      return (
        <AnimatedResult type="info" title="Интервальный график">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-4 "> Диапазон данных</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Интервальный график</strong> — это вертикальная визуализация диапазонов данных с использованием наложенных столбцов. 
                Внешний (зелёный) столбец показывает полный размах от минимума до максимума, а внутренний (синий) — межквартильный размах (IQR) 
                от Q1 до Q3. Горизонтальные линии отмечают медиану и среднее значение.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Визуализация диапазона:</strong> Наглядно показать размах данных от min до max</li>
                <li><strong>Центр распределения:</strong> Медиана и среднее видны как горизонтальные линии</li>
                <li><strong>Концентрация данных:</strong> IQR показывает, где находятся средние 50% данных</li>
                <li><strong>Сравнение групп:</strong> Можно разместить несколько интервальных графиков рядом</li>
                <li><strong>Простота восприятия:</strong> Интуитивно понятная визуализация для презентаций</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как интерпретировать?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>Зелёный столбец:</strong> Полный размах от минимума до максимума</li>
                <li><strong>Синий столбец:</strong> Межквартильный размах (IQR) — средние 50% данных</li>
                <li><strong>Синяя сплошная линия:</strong> Медиана (50-й процентиль)</li>
                <li><strong>Красная пунктирная линия:</strong> Среднее значение</li>
                <li><strong>Узкий IQR:</strong> Данные сконцентрированы</li>
                <li><strong>Большой размах:</strong> Есть экстремальные значения</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                // Полный размах (Min-Max)
                {
                  x: categories,
                  y: [dataResult.max - dataResult.min],
                  base: [dataResult.min],
                  type: 'bar',
                  name: 'Размах (Min-Max)',
                  marker: {
                    color: 'rgba(16, 185, 129, 0.2)',
                    line: {
                      color: '#10b981',
                      width: 2,
                    },
                  },
                  text: [`Range: ${decimalToFraction(dataResult.range, 2)}`],
                  textposition: 'inside',
                  hovertemplate: `Min: ${decimalToFraction(dataResult.min, 2)}<br>Max: ${decimalToFraction(dataResult.max, 2)}<br>Range: ${decimalToFraction(dataResult.range, 2)}<extra></extra>`,
                } as any,
                // IQR (Q1-Q3)
                {
                  x: categories,
                  y: [dataResult.q3 - dataResult.q1],
                  base: [dataResult.q1],
                  type: 'bar',
                  name: 'IQR (Q1-Q3)',
                  marker: {
                    color: 'rgba(99, 102, 241, 0.5)',
                    line: {
                      color: '#6366f1',
                      width: 3,
                    },
                  },
                  text: [`IQR: ${decimalToFraction(dataResult.iqr, 2)}`],
                  textposition: 'inside',
                  hovertemplate: `Q1: ${decimalToFraction(dataResult.q1, 2)}<br>Q3: ${decimalToFraction(dataResult.q3, 2)}<br>IQR: ${decimalToFraction(dataResult.iqr, 2)}<extra></extra>`,
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 500,
                title: {
                  text: 'Интервальное представление данных',
                  font: { size: 20, color: '#1e293b' }
                },
                yaxis: {
                  title: { text: 'Значения', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                xaxis: {
                  title: { text: '' },
                },
                barmode: 'overlay',
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                showlegend: true,
                legend: {
                  x: 1.02,
                  y: 1,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  bordercolor: '#e2e8f0',
                  borderwidth: 1,
                },
                shapes: [
                  // Линия медианы
                  {
                    type: 'line',
                    x0: -0.5,
                    x1: 0.5,
                    y0: dataResult.median,
                    y1: dataResult.median,
                    line: {
                      color: '#3b82f6',
                      width: 3,
                      dash: 'solid',
                    },
                  },
                  // Линия среднего
                  {
                    type: 'line',
                    x0: -0.5,
                    x1: 0.5,
                    y0: dataResult.mean,
                    y1: dataResult.mean,
                    line: {
                      color: '#ef4444',
                      width: 3,
                      dash: 'dash',
                    },
                  },
                ] as any,
                annotations: [
                  {
                    text: `Медиана: ${decimalToFraction(dataResult.median, 2)}`,
                    x: 0.6,
                    y: dataResult.median,
                    xref: 'x',
                    yref: 'y',
                    showarrow: true,
                    arrowhead: 2,
                    ax: 80,
                    ay: 0,
                    bgcolor: '#3b82f6',
                    font: { color: 'white', size: 12 },
                  },
                  {
                    text: `Среднее: ${decimalToFraction(dataResult.mean, 2)}`,
                    x: 0.6,
                    y: dataResult.mean,
                    xref: 'x',
                    yref: 'y',
                    showarrow: true,
                    arrowhead: 2,
                    ax: 80,
                    ay: dataResult.mean > dataResult.median ? -30 : 30,
                    bgcolor: '#ef4444',
                    font: { color: 'white', size: 12 },
                  },
                ] as any,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'интервальный_график',
                },
              }}
              style={{ width: '100%' }}
            />

            {/* Легенда */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg  border border-green-200">
                <p className="text-xs  font-semibold">Минимум</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.min} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border border-[#D4AF37]/25">
                <p className="text-xs  font-semibold">Q1</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q1} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border border-[#D4AF37]/25">
                <p className="text-xs  font-semibold">Q3</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q3} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border border-green-200">
                <p className="text-xs  font-semibold">Максимум</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.max} decimals={2} /></p>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Q-Q Plot (Квантиль-Квантильная диаграмма)
    if (selectedType === 'qqplot') {
      // Вычисление теоретических квантилей нормального распределения
      const calculateNormalQuantiles = (data: number[]) => {
        const n = data.length;
        const theoreticalQuantiles: number[] = [];
        
        // Функция обратного нормального распределения (приближение)
        const invNormalCDF = (p: number) => {
          const a1 = -3.969683028665376e+01;
          const a2 = 2.209460984245205e+02;
          const a3 = -2.759285104469687e+02;
          const a4 = 1.383577518672690e+02;
          const a5 = -3.066479806614716e+01;
          const a6 = 2.506628277459239e+00;
          
          const b1 = -5.447609879822406e+01;
          const b2 = 1.615858368580409e+02;
          const b3 = -1.556989798598866e+02;
          const b4 = 6.680131188771972e+01;
          const b5 = -1.328068155288572e+01;
          
          const c1 = -7.784894002430293e-03;
          const c2 = -3.223964580411365e-01;
          const c3 = -2.400758277161838e+00;
          const c4 = -2.549732539343734e+00;
          const c5 = 4.374664141464968e+00;
          const c6 = 2.938163982698783e+00;
          
          const d1 = 7.784695709041462e-03;
          const d2 = 3.224671290700398e-01;
          const d3 = 2.445134137142996e+00;
          const d4 = 3.754408661907416e+00;
          
          const pLow = 0.02425;
          const pHigh = 1 - pLow;
          
          let q: number;
          
          if (p < pLow) {
            const q2 = Math.sqrt(-2 * Math.log(p));
            q = (((((c1 * q2 + c2) * q2 + c3) * q2 + c4) * q2 + c5) * q2 + c6) /
                ((((d1 * q2 + d2) * q2 + d3) * q2 + d4) * q2 + 1);
          } else if (p <= pHigh) {
            const q2 = p - 0.5;
            const r = q2 * q2;
            q = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q2 /
                (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
          } else {
            const q2 = Math.sqrt(-2 * Math.log(1 - p));
            q = -(((((c1 * q2 + c2) * q2 + c3) * q2 + c4) * q2 + c5) * q2 + c6) /
                 ((((d1 * q2 + d2) * q2 + d3) * q2 + d4) * q2 + 1);
          }
          
          return q;
        };
        
        for (let i = 0; i < n; i++) {
          const p = (i + 0.5) / n; // Используем формулу (i + 0.5) / n
          theoreticalQuantiles.push(invNormalCDF(p));
        }
        
        return theoreticalQuantiles;
      };
      
      const theoreticalQuantiles = calculateNormalQuantiles(dataResult.sortedData);
      const minVal = Math.min(...theoreticalQuantiles, ...dataResult.sortedData);
      const maxVal = Math.max(...theoreticalQuantiles, ...dataResult.sortedData);
      
      return (
        <AnimatedResult type="info" title="Q-Q Plot (Квантиль-Квантильная диаграмма)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 ">Q-Q Plot (Quantile-Quantile Plot)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Что это за график?</h4>
              <p className="text-sm mb-3" style={{ color: 'var(--foreground-secondary)' }}>
                <strong>Q-Q Plot (Квантиль-Квантильная диаграмма)</strong> — это статистический инструмент для проверки, 
                насколько распределение ваших данных соответствует теоретическому нормальному распределению (распределению Гаусса).
              </p>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Для чего нужен?</h4>
              <ul className="text-sm space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong>Проверка нормальности:</strong> Визуально оценить, являются ли данные нормально распределёнными</li>
                <li><strong>Выявление отклонений:</strong> Обнаружить асимметрию, тяжёлые хвосты или выбросы</li>
                <li><strong>Предпосылка для тестов:</strong> Многие статистические тесты требуют нормальности данных (t-test, ANOVA)</li>
                <li><strong>Выбор метода:</strong> Решить, использовать параметрические или непараметрические методы</li>
              </ul>
              
              <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}> Как интерпретировать?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--foreground-secondary)' }}>
                <li><strong className="">Точки на прямой:</strong> Данные нормально распределены </li>
                <li><strong className="text-[#c9a227]">S-образная кривая:</strong> Асимметричное распределение (скошенность)</li>
                <li><strong className="text-[#b87c7c]">Точки выше линии справа:</strong> Тяжёлый правый хвост (выбросы вправо)</li>
                <li><strong className="text-[#b87c7c]">Точки ниже линии слева:</strong> Тяжёлый левый хвост (выбросы влево)</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                // Точки Q-Q
                {
                  x: theoreticalQuantiles,
                  y: dataResult.sortedData,
                  type: 'scatter',
                  mode: 'markers',
                  marker: {
                    color: '#a855f7',
                    size: 10,
                    line: {
                      color: '#7c3aed',
                      width: 1,
                    },
                  },
                  name: 'Данные',
                  hovertemplate: 'Теор. квантиль: %{x:.2f}<br>Факт. значение: %{y:.2f}<extra></extra>',
                } as any,
                // Теоретическая линия (y = x)
                {
                  x: [minVal, maxVal],
                  y: [minVal, maxVal],
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#ef4444',
                    width: 3,
                    dash: 'dash',
                  },
                  name: 'Теоретическая линия (нормальное распределение)',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 550,
                title: {
                  text: 'Проверка нормальности распределения',
                  font: { size: 20, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Теоретические квантили (нормальное распределение)', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                  zeroline: true,
                  zerolinecolor: '#94a3b8',
                },
                yaxis: {
                  title: { text: 'Фактические значения данных', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                  zeroline: true,
                  zerolinecolor: '#94a3b8',
                },
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                hovermode: 'closest',
                showlegend: true,
                legend: {
                  x: 0.02,
                  y: 0.98,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  bordercolor: '#e2e8f0',
                  borderwidth: 1,
                },
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'qq_plot',
                  width: 1200,
                  height: 800,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Выводы */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2">Рекомендации по использованию:</h4>
              <div className="text-sm  space-y-2">
                <p><strong> Подходит для:</strong> Любых количественных данных (непрерывных и дискретных)</p>
                <p><strong> Размер выборки:</strong> Эффективен при n ≥ 20 (чем больше, тем точнее)</p>
                <p><strong> Важно:</strong> Небольшие отклонения на концах графика допустимы</p>
                <p><strong> Примеры использования:</strong> Анализ остатков в регрессии, проверка предпосылок для t-теста, контроль качества в производстве</p>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Violin Plot (Скрипичная диаграмма)
    if (selectedType === 'violin') {
      return (
        <AnimatedResult type="info" title="Violin Plot (Скрипичная диаграмма)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-[#D4AF37]">Violin Plot (Скрипичная диаграмма)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Violin Plot</strong> — это гибридная визуализация, объединяющая <strong>Box Plot</strong> и <strong>Kernel Density Plot</strong>. 
                Форма "скрипки" показывает плотность распределения данных, а внутри отображаются квартили.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Визуализация распределения:</strong> Показывает не только медиану и квартили, но и форму распределения</li>
                <li><strong>Сравнение групп:</strong> Удобен для сравнения нескольких распределений одновременно</li>
                <li><strong>Обнаружение модальности:</strong> Можно увидеть унимодальное (один пик) или мультимодальное (несколько пиков) распределение</li>
                <li><strong>Плотность данных:</strong> Широкие части "скрипки" = больше данных в этом диапазоне</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как интерпретировать?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>Ширина скрипки:</strong> Показывает плотность (концентрацию) данных на каждом уровне</li>
                <li><strong>Симметричность:</strong> Симметричная скрипка ≈ нормальное распределение</li>
                <li><strong>Несколько выпуклостей:</strong> Признак мультимодального распределения (группы данных)</li>
                <li><strong>Внутренний Box Plot:</strong> Медиана (белая точка), Q1-Q3 (жирная линия), усы до Min/Max</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  y: dataResult.sortedData,
                  type: 'violin',
                  box: {
                    visible: true,
                    fillcolor: 'rgba(255,255,255,0.8)',
                    line: {
                      color: '#ec4899',
                      width: 2,
                    },
                  },
                  meanline: {
                    visible: true,
                    color: '#ef4444',
                  },
                  fillcolor: 'rgba(236, 72, 153, 0.3)',
                  line: {
                    color: '#ec4899',
                    width: 2,
                  },
                  opacity: 0.7,
                  points: 'all',
                  jitter: 0.3,
                  pointpos: -1.5,
                  marker: {
                    color: '#a855f7',
                    size: 4,
                    opacity: 0.6,
                  },
                  name: 'Распределение',
                  hoverinfo: 'y',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 600,
                title: {
                  text: 'Violin Plot: Распределение + Квартили',
                  font: { size: 20, color: '#1e293b' }
                },
                yaxis: {
                  title: { text: 'Значения', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                  zeroline: false,
                },
                xaxis: {
                  showticklabels: false,
                },
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                showlegend: false,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'violin_plot',
                  width: 1200,
                  height: 900,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Статистика */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg  border-2 border-[#D4AF37]/35">
                <p className="text-xs text-[#78716c] font-semibold">Медиана</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.median} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Среднее</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.mean} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">IQR</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.iqr} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">Ст. откл.</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.stdDev} decimals={2} /></p>
              </div>
            </div>
            
            {/* Преимущества */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2">Преимущества Violin Plot:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-[#57534e]">
                <div>
                  <p><strong className=""> Больше информации:</strong> Показывает и квартили, и плотность</p>
                  <p><strong className=""> Видны пики:</strong> Обнаруживает мультимодальность</p>
                </div>
                <div>
                  <p><strong className=""> Применение:</strong> Биостатистика, машинное обучение, A/B тесты</p>
                  <p><strong className="text-[#c9a227]"> Требует:</strong> Достаточно данных (n ≥ 30 для плавной кривой)</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Cumulative Distribution (Кумулятивное распределение)
    if (selectedType === 'cumulative') {
      const cumulativeData = dataResult.sortedData.map((val, idx) => ({
        x: val,
        y: ((idx + 1) / dataResult.count) * 100, // Кумулятивный процент
      }));
      
      return (
        <AnimatedResult type="info" title="Cumulative Distribution (Кумулятивная функция распределения)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-[#D4AF37]"> Cumulative Distribution Function (CDF)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Кумулятивная функция распределения (CDF)</strong> — это график, показывающий накопленную вероятность 
                или процент данных, которые меньше или равны определённому значению. График имеет характерную S-образную форму, 
                начинается с 0% и заканчивается на 100%.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Процентили и квантили:</strong> Легко найти, какой % данных ниже заданного значения</li>
                <li><strong>Сравнение распределений:</strong> Удобно сравнивать разные наборы данных</li>
                <li><strong>Медиана:</strong> Точка пересечения с линией 50% показывает медиану</li>
                <li><strong>Диапазоны:</strong> Можно увидеть, в каком диапазоне сконцентрировано большинство данных</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как читать график?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>Ось X:</strong> Значения данных (от минимума до максимума)</li>
                <li><strong>Ось Y:</strong> Кумулятивный процент (от 0% до 100%)</li>
                <li><strong>Пример:</strong> Если точка (25, 40%), то 40% данных ≤ 25</li>
                <li><strong>Крутые участки:</strong> Там много данных (высокая плотность)</li>
                <li><strong>Пологие участки:</strong> Мало данных (низкая плотность)</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                // Кумулятивная линия
                {
                  x: cumulativeData.map(d => d.x),
                  y: cumulativeData.map(d => d.y),
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: {
                    color: '#14b8a6',
                    width: 3,
                    shape: 'hv', // Ступенчатая линия
                  },
                  marker: {
                    color: '#0d9488',
                    size: 6,
                  },
                  name: 'CDF',
                  hovertemplate: 'Значение: %{x:.2f}<br>Кумул. %: %{y:.1f}%<extra></extra>',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 550,
                title: {
                  text: 'Кумулятивная функция распределения (CDF)',
                  font: { size: 20, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Значения', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                yaxis: {
                  title: { text: 'Кумулятивный процент (%)', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                  range: [0, 105],
                },
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                shapes: [
                  // Линия медианы (50%)
                  {
                    type: 'line',
                    x0: dataResult.min,
                    x1: dataResult.max,
                    y0: 50,
                    y1: 50,
                    line: {
                      color: '#ef4444',
                      width: 2,
                      dash: 'dash',
                    },
                  },
                  // Линия 25% (Q1)
                  {
                    type: 'line',
                    x0: dataResult.min,
                    x1: dataResult.max,
                    y0: 25,
                    y1: 25,
                    line: {
                      color: '#6366f1',
                      width: 1,
                      dash: 'dot',
                    },
                  },
                  // Линия 75% (Q3)
                  {
                    type: 'line',
                    x0: dataResult.min,
                    x1: dataResult.max,
                    y0: 75,
                    y1: 75,
                    line: {
                      color: '#6366f1',
                      width: 1,
                      dash: 'dot',
                    },
                  },
                ] as any,
                annotations: [
                  {
                    x: dataResult.median,
                    y: 50,
                    text: `Медиана: ${decimalToFraction(dataResult.median, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    ax: 60,
                    ay: -30,
                    bgcolor: '#ef4444',
                    font: { color: 'white', size: 11 },
                  },
                  {
                    x: dataResult.q1,
                    y: 25,
                    text: `Q1: ${decimalToFraction(dataResult.q1, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    ax: -50,
                    ay: 20,
                    bgcolor: '#6366f1',
                    font: { color: 'white', size: 10 },
                  },
                  {
                    x: dataResult.q3,
                    y: 75,
                    text: `Q3: ${decimalToFraction(dataResult.q3, 2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    ax: -50,
                    ay: -20,
                    bgcolor: '#6366f1',
                    font: { color: 'white', size: 10 },
                  },
                ] as any,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'cumulative_distribution',
                  width: 1200,
                  height: 800,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Ключевые проценти */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg  border-2 border-[#D4AF37]/35">
                <p className="text-xs text-[#78716c] font-semibold">0% (Min)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.min} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">25% (Q1)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q1} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">50% (Медиана)</p>
                <p className="text-lg font-bold text-[#5c3d3d]"><FractionDisplay value={dataResult.median} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 ">
                <p className="text-xs  font-semibold">75% (Q3)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.q3} decimals={2} /></p>
              </div>
              <div className="p-3 rounded-lg  border-2 border-[#D4AF37]/35">
                <p className="text-xs text-[#78716c] font-semibold">100% (Max)</p>
                <p className="text-lg font-bold "><FractionDisplay value={dataResult.max} decimals={2} /></p>
              </div>
            </div>
            
            {/* Применение */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Практическое применение:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-[#57534e]">
                <div>
                  <p><strong className=""> Бизнес:</strong> Анализ продаж (какой % клиентов купил меньше X)</p>
                  <p><strong className=""> Образование:</strong> Распределение оценок (сколько студентов ниже порога)</p>
                </div>
                <div>
                  <p><strong className=""> Финансы:</strong> Риск-менеджмент (вероятность убытков)</p>
                  <p><strong className="text-[#c9a227]"> Производство:</strong> Контроль качества (% брака)</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Density Plot (График плотности)
    if (selectedType === 'density') {
      // Простая оценка плотности через сглаженную гистограмму
      const bins = dataResult.histogram;
      const densityData = bins.map(bin => ({
        x: (bin.range[0] + bin.range[1]) / 2,
        y: bin.frequency * 100, // Частота в процентах
      }));
      
      return (
        <AnimatedResult type="info" title="Density Plot (График плотности вероятности)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-amber-600"> Density Plot (КПВ - Кривая плотности вероятности)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-amber-800 mb-3">
                <strong>График плотности (Density Plot)</strong> — это сглаженная версия гистограммы, показывающая непрерывную 
                кривую распределения вероятности. Использует метод <strong>Kernel Density Estimation (KDE)</strong> для создания 
                плавной кривой через точки данных.
              </p>
              
              <h4 className="font-bold  mb-2">Для чего нужен?</h4>
              <ul className="text-sm text-amber-800 space-y-1 mb-3 list-disc list-inside">
                <li><strong>Форма распределения:</strong> Визуализирует, как распределены данные (нормальное, скошенное, бимодальное)</li>
                <li><strong>Сглаживание:</strong> Убирает "шум" гистограммы, показывая общий тренд</li>
                <li><strong>Сравнение распределений:</strong> Можно наложить несколько кривых для сравнения</li>
                <li><strong>Поиск пиков:</strong> Легко находить моды (наиболее частые значения)</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как интерпретировать?</h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li><strong>Пики (моды):</strong> Самые частые значения (вершины кривой)</li>
                <li><strong>Один пик:</strong> Унимодальное распределение</li>
                <li><strong>Два+ пика:</strong> Бимодальное/мультимодальное (разные группы данных)</li>
                <li><strong>Площадь под кривой:</strong> Всегда = 1 (или 100% вероятности)</li>
                <li><strong>Ширина:</strong> Показывает разброс данных (variance)</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                // Кривая плотности
                {
                  x: densityData.map(d => d.x),
                  y: densityData.map(d => d.y),
                  type: 'scatter',
                  mode: 'lines',
                  fill: 'tozeroy',
                  line: {
                    color: '#f59e0b',
                    width: 3,
                    shape: 'spline', // Сглаженная кривая
                  },
                  fillcolor: 'rgba(245, 158, 11, 0.2)',
                  name: 'Плотность',
                  hovertemplate: 'Значение: %{x:.2f}<br>Плотность: %{y:.1f}%<extra></extra>',
                } as any,
                // Точка медианы
                {
                  x: [dataResult.median],
                  y: [densityData.find(d => Math.abs(d.x - dataResult.median) < (dataResult.max - dataResult.min) / bins.length * 2)?.y || 0],
                  type: 'scatter',
                  mode: 'markers+text',
                  marker: {
                    color: '#ef4444',
                    size: 15,
                    symbol: 'diamond',
                  },
                  text: ['Медиана'],
                  textposition: 'top',
                  name: 'Медиана',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 550,
                title: {
                  text: 'Кривая плотности вероятности (Kernel Density Estimation)',
                  font: { size: 20, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Значения', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                yaxis: {
                  title: { text: 'Плотность вероятности (%)', font: { size: 14 } },
                  gridcolor: '#e2e8f0',
                },
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                showlegend: true,
                legend: {
                  x: 0.7,
                  y: 0.95,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  bordercolor: '#e2e8f0',
                  borderwidth: 1,
                },
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'density_plot',
                  width: 1200,
                  height: 800,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Сравнение с гистограммой */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Density Plot vs Гистограмма:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-amber-800">
                <div>
                  <p><strong className=""> Преимущества Density:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Плавная кривая (легче читать)</li>
                    <li>Не зависит от ширины бинов</li>
                    <li>Лучше показывает форму</li>
                  </ul>
                </div>
                <div>
                  <p><strong className="text-[#c9a227]"> Когда использовать:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Непрерывные данные</li>
                    <li>Презентации (красивее)</li>
                    <li>Большие выборки (n &gt; 50)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Heatmap (Тепловая карта)
    if (selectedType === 'heatmap') {
      // Создаем тепловую карту распределения данных по интервалам
      const bins = dataResult.histogram;
      const matrixSize = Math.ceil(Math.sqrt(bins.length));
      const heatmapData: number[][] = [];
      const labels: string[] = [];
      
      // Заполняем матрицу частотами
      for (let i = 0; i < matrixSize; i++) {
        heatmapData[i] = [];
        for (let j = 0; j < matrixSize; j++) {
          const idx = i * matrixSize + j;
          heatmapData[i][j] = idx < bins.length ? bins[idx].count : 0;
        }
      }
      
      // Создаем метки для интервалов
      for (let i = 0; i < matrixSize; i++) {
        labels.push(`[${i * matrixSize}-${(i + 1) * matrixSize})`);
      }
      
      return (
        <AnimatedResult type="info" title="Heatmap (Тепловая карта)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-rose-600"> Heatmap (Тепловая карта частот)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-rose-800 mb-3">
                <strong>Heatmap (Тепловая карта)</strong> — это визуализация данных в виде матрицы, где значения представлены цветом. 
                Обычно используется для корреляционных матриц, но здесь показывает распределение частот данных по интервалам.
              </p>
              
              <h4 className="font-bold  mb-2">Для чего нужен?</h4>
              <ul className="text-sm text-rose-800 space-y-1 mb-3 list-disc list-inside">
                <li><strong>Корреляции:</strong> Находить взаимосвязи между переменными</li>
                <li><strong>Паттерны:</strong> Обнаруживать скрытые закономерности в данных</li>
                <li><strong>Кластеризация:</strong> Визуализировать группировку данных</li>
                <li><strong>Аномалии:</strong> Быстро находить выбросы (яркие пятна)</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как читать график?</h4>
              <ul className="text-sm text-rose-800 space-y-1 list-disc list-inside">
                <li><strong className="text-[#b87c7c]">Красный/Горячий:</strong> Высокие значения (много данных)</li>
                <li><strong className="">Синий/Холодный:</strong> Низкие значения (мало данных)</li>
                <li><strong>Диагональ:</strong> В корреляции показывает связь переменной с собой (=1)</li>
                <li><strong>Симметрия:</strong> Корреляционная матрица всегда симметрична</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  z: heatmapData,
                  x: labels,
                  y: labels,
                  type: 'heatmap',
                  colorscale: [
                    [0, '#1e3a8a'],     // Темно-синий (холодный)
                    [0.25, '#3b82f6'],  // Синий
                    [0.5, '#fbbf24'],   // Желтый
                    [0.75, '#f97316'],  // Оранжевый
                    [1, '#dc2626']      // Красный (горячий)
                  ],
                  colorbar: {
                    title: { text: 'Частота', side: 'right' },
                    thickness: 20,
                    len: 0.7,
                  },
                  hovertemplate: 'Интервал X: %{x}<br>Интервал Y: %{y}<br>Частота: %{z}<extra></extra>',
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 600,
                title: {
                  text: 'Тепловая карта распределения данных',
                  font: { size: 20, color: '#1e293b' }
                },
                xaxis: {
                  title: { text: 'Интервалы данных', font: { size: 14 } },
                },
                yaxis: {
                  title: { text: 'Интервалы данных', font: { size: 14 } },
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'heatmap',
                  width: 1000,
                  height: 1000,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Применение */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Практическое применение:</h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm text-rose-800">
                <div>
                  <p><strong className=""> Биоинформатика:</strong> Экспрессия генов</p>
                </div>
                <div>
                  <p><strong className=""> Финансы:</strong> Корреляция активов</p>
                </div>
                <div>
                  <p><strong className=""> ML:</strong> Матрица ошибок (confusion matrix)</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }

    // Radar Chart (Радарная диаграмма)
    if (selectedType === 'radar') {
      // Создаем радарную диаграмму для статистических показателей
      const stats = [
        { label: 'Min', value: dataResult.min },
        { label: 'Q1', value: dataResult.q1 },
        { label: 'Медиана', value: dataResult.median },
        { label: 'Среднее', value: dataResult.mean },
        { label: 'Q3', value: dataResult.q3 },
        { label: 'Max', value: dataResult.max },
      ];
      
      // Нормализуем значения от 0 до 100
      const maxVal = Math.max(...stats.map(s => Math.abs(s.value)));
      const normalizedStats = stats.map(s => ({
        ...s,
        normalized: (Math.abs(s.value) / maxVal) * 100,
      }));
      
      return (
        <AnimatedResult type="info" title="Radar Chart (Радарная диаграмма)">
          <div className="p-6 rounded-xl border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-2xl font-bold mb-4 text-[#D4AF37]">Radar Chart (Многомерное сравнение)</h3>
            
            {/* Описание графика */}
            <div className="mb-6 p-4 rounded-lg border-l-4" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
              <h4 className="font-bold  mb-2"> Что это за график?</h4>
              <p className="text-sm text-[#57534e] mb-3">
                <strong>Radar Chart (Радарная диаграмма)</strong> — это способ отображения многомерных данных на 2D плоскости. 
                Каждая ось (луч) представляет одну переменную, а значения откладываются от центра. Соединяя точки, получаем многоугольник.
              </p>
              
              <h4 className="font-bold  mb-2"> Для чего нужен?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 mb-3 list-disc list-inside">
                <li><strong>Многомерное сравнение:</strong> Сравнить объекты сразу по нескольким параметрам</li>
                <li><strong>Профили:</strong> Создать "отпечаток" характеристик (спортсмен, продукт, компания)</li>
                <li><strong>Баланс:</strong> Визуально оценить сбалансированность показателей</li>
                <li><strong>Сильные/слабые стороны:</strong> Найти области для улучшения</li>
              </ul>
              
              <h4 className="font-bold  mb-2"> Как интерпретировать?</h4>
              <ul className="text-sm text-[#57534e] space-y-1 list-disc list-inside">
                <li><strong>Большая область:</strong> Высокие значения по многим параметрам</li>
                <li><strong>Правильный многоугольник:</strong> Сбалансированные показатели</li>
                <li><strong>Острые углы:</strong> Дисбаланс (одни параметры сильнее других)</li>
                <li><strong>Близость к центру:</strong> Низкие значения</li>
              </ul>
            </div>
            
            {/* @ts-ignore */}
            <Plot
              data={[
                {
                  type: 'scatterpolar',
                  r: normalizedStats.map(s => s.normalized),
                  theta: stats.map(s => s.label),
                  fill: 'toself',
                  fillcolor: 'rgba(139, 92, 246, 0.2)',
                  line: {
                    color: '#8b5cf6',
                    width: 3,
                  },
                  marker: {
                    color: '#7c3aed',
                    size: 10,
                  },
                  name: 'Статистика',
                  hovertemplate: '%{theta}: %{text}<br>Норм.: %{r:.1f}%<extra></extra>',
                  text: stats.map(s => decimalToFraction(s.value, 2)),
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 650,
                title: {
                  text: 'Радарная диаграмма статистических показателей',
                  font: { size: 20, color: '#1e293b' }
                },
                polar: {
                  radialaxis: {
                    visible: true,
                    range: [0, 100],
                    gridcolor: '#e2e8f0',
                  },
                  angularaxis: {
                    gridcolor: '#e2e8f0',
                  },
                  bgcolor: '#fafafa',
                },
                paper_bgcolor: 'white',
                showlegend: false,
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'radar_chart',
                  width: 1000,
                  height: 1000,
                },
              }}
              style={{ width: '100%' }}
            />
            
            {/* Таблица значений */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-3 rounded-lg  border-2 border-[#D4AF37]/35">
                  <p className="text-xs text-[#78716c] font-semibold">{stat.label}</p>
                  <p className="text-lg font-bold "><FractionDisplay value={stat.value} decimals={2} /></p>
                </div>
              ))}
            </div>
            
            {/* Применение */}
            <div className="mt-6 p-4 bg-gradient-to-r  rounded-lg border ">
              <h4 className="font-bold  mb-2"> Примеры использования:</h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm text-[#57534e]">
                <div>
                  <p><strong className=""> Спорт:</strong> Профиль навыков игрока (скорость, сила, техника)</p>
                </div>
                <div>
                  <p><strong className=""> Бизнес:</strong> Сравнение продуктов по характеристикам</p>
                </div>
                <div>
                  <p><strong className="text-[#c9a227]"> Образование:</strong> Оценка компетенций студента</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedResult>
      );
    }


    return null;
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
              <LineChart className="w-12 h-12 " />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--foreground)' }}>
                Построение графиков
              </h1>
            </div>
            <p className="text-xl" style={{ color: 'var(--foreground-secondary)' }}>
              Выберите тип графика и визуализируйте ваши данные
            </p>
          </div>

          {/* Выбор типа графика */}
          <div className="mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Выберите тип графика:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {graphTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value);
                    setDataResult(null);
                    setResult2D(null);
                    setResult3D(null);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 hover:shadow-lg ${
                    selectedType === type.value
                      ? 'border-[#D4AF37] '
                      : 'border-gray-200 card-midnight hover:'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">{type.label}</div>
                  <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Формы ввода */}
          <div className="mb-12 max-w-3xl mx-auto">
            {(selectedType === 'boxplot' || selectedType === 'violin' || selectedType === 'scatter' || 
              selectedType === 'histogram' || selectedType === 'density' || selectedType === 'interval' || 
              selectedType === 'qqplot' || selectedType === 'cumulative' || selectedType === 'heatmap' || 
              selectedType === 'radar') && (
              <div className="p-6 rounded-2xl border-2 shadow-lg" 
                style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <BarChart3 className="w-6 h-6 " />
                  Ввод данных
                </h2>

                <form onSubmit={dataForm.handleSubmit(onSubmitData)} className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                      Данные для анализа
                    </label>
                    <textarea
                      {...dataForm.register('data')}
                      className="w-full px-4 py-3 rounded-lg border-2 text-base transition-all focus:ring-2 focus:ring-[#D4AF37]"
                      style={{ borderColor: 'var(--border)' }}
                      placeholder="12, 15, 18, 20, 22, 25, 28, 50, 100"
                      rows={4}
                    />
                    {dataForm.formState.errors.data && (
                      <p className="mt-1 text-sm text-[#b87c7c]">{dataForm.formState.errors.data.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    loading={isLoading} 
                    disabled={isLoading}
                    className="w-full h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-[#1c1917]"
                  >
                    {isLoading ? 'Строим...' : 'Построить график'}
                  </Button>
                </form>
              </div>
            )}

            {(selectedType === 'function2d' || selectedType === 'polar') && (
              <div className="p-6 rounded-2xl border-2 shadow-lg" 
                style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <LineChart className="w-6 h-6 " />
                  {selectedType === 'polar' ? 'Полярный график r = f(θ)' : '2D График функции'}
                </h2>

                <form onSubmit={function2DForm.handleSubmit(onSubmit2D)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      Функция f(x)
                    </label>
                    <input
                      {...function2DForm.register('expression')}
                      className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-[#D4AF37]"
                      style={{ borderColor: 'var(--border)' }}
                      placeholder="x^2"
                    />
                    <p className="mt-1 text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                      {selectedType === 'polar' 
                        ? 'Примеры: sin(3*x) - роза, 1+cos(x) - кардиоида, x/2 - спираль, e^(x/10)' 
                        : 'Примеры: x^2, sin(x), x^3 - 2*x + 1, exp(x), log(x)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        X min
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function2DForm.register('xMin', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        X max
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function2DForm.register('xMax', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    loading={isLoading} 
                    disabled={isLoading}
                    className="w-full h-12 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-[#1c1917]"
                  >
                    {isLoading ? 'Строим...' : 'Построить 2D график'}
                  </Button>
                </form>
              </div>
            )}

            {(selectedType === 'function3d' || selectedType === 'contour') && (
              <div className="p-6 rounded-2xl border-2 shadow-lg" 
                style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Box className="w-6 h-6 " />
                  {selectedType === 'contour' ? 'Контурный график z = f(x,y)' : '3D График функции'}
                </h2>

                <form onSubmit={function3DForm.handleSubmit(onSubmit3D)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      Функция f(x,y)
                    </label>
                    <input
                      {...function3DForm.register('expression')}
                      className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:ring-2 focus:ring-[#D4AF37]"
                      style={{ borderColor: 'var(--border)' }}
                      placeholder="x^2 + y^2"
                    />
                    <p className="mt-1 text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                      {selectedType === 'contour'
                        ? 'Примеры: x^2 + y^2 - параболоид, sin(sqrt(x^2+y^2)) - кольца, x*y - седло'
                        : 'Примеры: x^2 + y^2, sin(x) * cos(y), x*y'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        X min
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function3DForm.register('xMin', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        X max
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function3DForm.register('xMax', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        Y min
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function3DForm.register('yMin', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        Y max
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...function3DForm.register('yMax', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    loading={isLoading} 
                    disabled={isLoading}
                    className="w-full h-12 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 gradient-primary text-[#1c1917]"
                  >
                    {isLoading ? 'Строим...' : 'Построить 3D график'}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Отображение графика */}
          {(dataResult || result2D || result3D) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {renderGraph()}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default GraphsPage;
