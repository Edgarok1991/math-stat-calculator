import { Injectable } from '@nestjs/common';
import { DescriptiveStatisticsResult, HistogramBin } from './interfaces/statistics-result.interface';
import { FunctionGraph2DResult, FunctionGraph3DResult, Point2D, Point3D } from './interfaces/function-graph.interface';
import { evaluate } from 'mathjs';

@Injectable()
export class StatisticsService {
  calculateDescriptiveStatistics(data: number[]): DescriptiveStatisticsResult {
    if (!data || data.length === 0) {
      throw new Error('Данные не могут быть пустыми');
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    // Среднее значение
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Медиана
    const median = this.calculateMedian(sorted);

    // Мода
    const mode = this.calculateMode(data);

    // Размах
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // Квартили
    const q1 = this.calculateQuartile(sorted, 0.25);
    const q2 = median; // Q2 = медиана
    const q3 = this.calculateQuartile(sorted, 0.75);
    const iqr = q3 - q1; // Межквартильный размах

    // Дисперсия
    const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;

    // Стандартное отклонение
    const stdDev = Math.sqrt(variance);

    // Границы для определения выбросов (метод Тьюки)
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    // Определение выбросов
    const outliers = data.filter(value => value < lowerFence || value > upperFence);

    // Расчет данных для гистограммы
    const histogram = this.calculateHistogram(sorted);

    return {
      mean,
      median,
      mode,
      range,
      q1,
      q2,
      q3,
      iqr,
      variance,
      stdDev,
      min,
      max,
      count: n,
      sum,
      outliers,
      lowerFence,
      upperFence,
      histogram,
      sortedData: sorted,
    };
  }

  private calculateHistogram(sorted: number[]): HistogramBin[] {
    const n = sorted.length;
    const min = sorted[0];
    const max = sorted[n - 1];
    
    // Используем правило Стёрджеса для определения количества интервалов
    const numBins = Math.ceil(1 + 3.322 * Math.log10(n));
    const binWidth = (max - min) / numBins;

    const bins: HistogramBin[] = [];

    for (let i = 0; i < numBins; i++) {
      const rangeMin = min + i * binWidth;
      const rangeMax = i === numBins - 1 ? max : min + (i + 1) * binWidth;
      
      const count = sorted.filter(value => 
        i === numBins - 1 
          ? value >= rangeMin && value <= rangeMax
          : value >= rangeMin && value < rangeMax
      ).length;

      bins.push({
        range: [rangeMin, rangeMax],
        count,
        frequency: count / n,
      });
    }

    return bins;
  }

  private calculateMedian(sorted: number[]): number {
    const n = sorted.length;
    if (n % 2 === 0) {
      return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    } else {
      return sorted[Math.floor(n / 2)];
    }
  }

  private calculateQuartile(sorted: number[], percentile: number): number {
    const n = sorted.length;
    
    if (percentile === 0.5) {
      return this.calculateMedian(sorted);
    }
    
    // Метод Мура и Маккейба (эксклюзивный метод)
    // Q1 = медиана нижней половины, Q3 = медиана верхней половины
    if (percentile === 0.25) {
      // Q1: медиана первой половины данных
      const mid = Math.floor(n / 2);
      const lowerHalf = sorted.slice(0, mid);
      return this.calculateMedian(lowerHalf);
    } else if (percentile === 0.75) {
      // Q3: медиана второй половины данных
      const mid = n % 2 === 0 ? n / 2 : Math.floor(n / 2) + 1;
      const upperHalf = sorted.slice(mid);
      return this.calculateMedian(upperHalf);
    }
    
    // Для других перцентилей используем линейную интерполяцию
    const index = percentile * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateMode(data: number[]): number[] {
    const frequency = new Map<number, number>();
    
    // Подсчет частоты
    data.forEach(value => {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });

    // Находим максимальную частоту
    const maxFreq = Math.max(...Array.from(frequency.values()));

    // Если все элементы встречаются одинаково часто, моды нет
    if (maxFreq === 1) {
      return [];
    }

    // Возвращаем все значения с максимальной частотой
    return Array.from(frequency.entries())
      .filter(([, freq]) => freq === maxFreq)
      .map(([value]) => value)
      .sort((a, b) => a - b);
  }

  // Построение 2D графика функции
  calculate2DGraph(expression: string, xMin: number, xMax: number, numPoints: number = 100): FunctionGraph2DResult {
    const points: Point2D[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    let yMin = Infinity;
    let yMax = -Infinity;

    for (let i = 0; i < numPoints; i++) {
      const x = xMin + i * step;
      try {
        const y = evaluate(expression, { x });
        if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
          points.push({ x, y });
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } catch (error) {
        // Пропускаем точки с ошибкой вычисления
      }
    }

    return {
      points,
      xMin,
      xMax,
      yMin: yMin === Infinity ? 0 : yMin,
      yMax: yMax === -Infinity ? 0 : yMax,
    };
  }

  // Построение 3D графика функции
  calculate3DGraph(expression: string, xMin: number, xMax: number, yMin: number, yMax: number, numPoints: number = 20): FunctionGraph3DResult {
    const points: Point3D[] = [];
    const xStep = (xMax - xMin) / (numPoints - 1);
    const yStep = (yMax - yMin) / (numPoints - 1);

    let zMin = Infinity;
    let zMax = -Infinity;

    for (let i = 0; i < numPoints; i++) {
      for (let j = 0; j < numPoints; j++) {
        const x = xMin + i * xStep;
        const y = yMin + j * yStep;
        try {
          const z = evaluate(expression, { x, y });
          if (typeof z === 'number' && !isNaN(z) && isFinite(z)) {
            points.push({ x, y, z });
            zMin = Math.min(zMin, z);
            zMax = Math.max(zMax, z);
          }
        } catch (error) {
          // Пропускаем точки с ошибкой вычисления
        }
      }
    }

    return {
      points,
      xMin,
      xMax,
      yMin,
      yMax,
      zMin: zMin === Infinity ? 0 : zMin,
      zMax: zMax === -Infinity ? 0 : zMax,
    };
  }
}

