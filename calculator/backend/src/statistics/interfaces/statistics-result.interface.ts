export interface HistogramBin {
  range: [number, number];  // Диапазон интервала [min, max]
  count: number;            // Количество значений в интервале
  frequency: number;        // Частота (count / total)
}

export interface DescriptiveStatisticsResult {
  mean: number;           // Среднее значение
  median: number;         // Медиана
  mode: number[];         // Мода (может быть несколько значений)
  range: number;          // Размах
  q1: number;             // Первый квартиль (25%)
  q2: number;             // Второй квартиль (50%, медиана)
  q3: number;             // Третий квартиль (75%)
  iqr: number;            // Межквартильный размах
  variance: number;       // Дисперсия
  stdDev: number;         // Стандартное отклонение
  min: number;            // Минимум
  max: number;            // Максимум
  count: number;          // Количество элементов
  sum: number;            // Сумма
  outliers: number[];     // Выбросы
  lowerFence: number;     // Нижняя граница (Q1 - 1.5*IQR)
  upperFence: number;     // Верхняя граница (Q3 + 1.5*IQR)
  histogram: HistogramBin[]; // Данные для гистограммы
  sortedData: number[];   // Отсортированные данные для графиков
}

