import { Injectable } from '@nestjs/common';
import { AnovaDto } from './dto/anova.dto';
import { AnovaResult } from './interfaces/anova-result.interface';

@Injectable()
export class AnovaService {
  calculateAnova(data: AnovaDto): AnovaResult {
    const { groups, alpha } = data;

    if (groups.length < 2) {
      throw new Error('Необходимо минимум 2 группы');
    }

    const groupMeans = groups.map(group => this.calculateMean(group));
    const groupVariances = groups.map(group => this.calculateVariance(group));
    const groupSizes = groups.map(group => group.length);

    // Общее среднее
    const totalSum = groups.reduce((sum, group) => sum + group.reduce((a, b) => a + b, 0), 0);
    const totalCount = groups.reduce((sum, group) => sum + group.length, 0);
    const grandMean = totalSum / totalCount;

    // Сумма квадратов между группами (SSB)
    const ssb = groups.reduce((sum, group, i) => {
      const groupSum = group.reduce((a, b) => a + b, 0);
      const groupMean = groupSum / group.length;
      return sum + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);

    // Сумма квадратов внутри групп (SSW)
    const ssw = groups.reduce((sum, group) => {
      const groupMean = this.calculateMean(group);
      return sum + group.reduce((groupSum, value) => {
        return groupSum + Math.pow(value - groupMean, 2);
      }, 0);
    }, 0);

    // Степени свободы
    const dfBetween = groups.length - 1;
    const dfWithin = totalCount - groups.length;
    const dfTotal = totalCount - 1;

    // Средние квадраты
    const msb = ssb / dfBetween;
    const msw = ssw / dfWithin;

    // F-статистика
    const fStatistic = msb / msw;

    // Критическое значение F
    const criticalValue = this.calculateFCritical(dfBetween, dfWithin, alpha);

    // p-значение (приближенное)
    const pValue = this.calculatePValue(fStatistic, dfBetween, dfWithin);

    const significant = fStatistic > criticalValue;

    return {
      fStatistic,
      pValue,
      criticalValue,
      significant,
      groupMeans,
      groupVariances,
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateFCritical(df1: number, df2: number, alpha: number): number {
    // Упрощенная таблица критических значений F
    // В реальном приложении следует использовать более точные таблицы или библиотеки
    const fTable = {
      0.01: {
        1: { 1: 4052, 2: 98.5, 3: 34.1, 4: 21.2, 5: 16.3, 10: 10.0, 20: 8.1, 30: 7.6 },
        2: { 1: 5000, 2: 99.0, 3: 30.8, 4: 18.0, 5: 13.3, 10: 7.6, 20: 5.8, 30: 5.4 },
        3: { 1: 5403, 2: 99.2, 3: 29.5, 4: 16.7, 5: 12.1, 10: 6.6, 20: 4.9, 30: 4.5 },
        4: { 1: 5625, 2: 99.2, 3: 28.7, 4: 15.8, 5: 11.4, 10: 6.0, 20: 4.4, 30: 4.0 },
        5: { 1: 5764, 2: 99.3, 3: 28.2, 4: 15.2, 5: 10.9, 10: 5.6, 20: 4.1, 30: 3.7 },
      },
      0.05: {
        1: { 1: 161.4, 2: 18.5, 3: 10.1, 4: 7.7, 5: 6.6, 10: 4.9, 20: 4.4, 30: 4.2 },
        2: { 1: 199.5, 2: 19.0, 3: 9.6, 4: 6.9, 5: 5.8, 10: 4.1, 20: 3.5, 30: 3.3 },
        3: { 1: 215.7, 2: 19.2, 3: 9.3, 4: 6.6, 5: 5.4, 10: 3.7, 20: 3.1, 30: 2.9 },
        4: { 1: 224.6, 2: 19.2, 3: 9.1, 4: 6.4, 5: 5.2, 10: 3.5, 20: 2.9, 30: 2.7 },
        5: { 1: 230.2, 2: 19.3, 3: 9.0, 4: 6.3, 5: 5.1, 10: 3.3, 20: 2.7, 30: 2.5 },
      },
      0.1: {
        1: { 1: 39.9, 2: 8.5, 3: 5.5, 4: 4.5, 5: 4.1, 10: 3.1, 20: 2.6, 30: 2.4 },
        2: { 1: 49.5, 2: 9.0, 3: 5.5, 4: 4.3, 5: 3.8, 10: 2.7, 20: 2.2, 30: 2.0 },
        3: { 1: 53.6, 2: 9.2, 3: 5.4, 4: 4.2, 5: 3.6, 10: 2.5, 20: 2.0, 30: 1.8 },
        4: { 1: 55.8, 2: 9.2, 3: 5.3, 4: 4.1, 5: 3.5, 10: 2.4, 20: 1.9, 30: 1.7 },
        5: { 1: 57.2, 2: 9.3, 3: 5.3, 4: 4.0, 5: 3.4, 10: 2.3, 20: 1.8, 30: 1.6 },
      },
    };

    const alphaKey = alpha as keyof typeof fTable;
    const df1Key = Math.min(df1, 5) as keyof typeof fTable[typeof alphaKey];
    const df2Key = df2 <= 10 ? 10 : df2 <= 20 ? 20 : 30;

    return fTable[alphaKey][df1Key][df2Key] || 3.84; // Значение по умолчанию
  }

  private calculatePValue(fStatistic: number, df1: number, df2: number): number {
    // Упрощенное вычисление p-значения
    // В реальном приложении следует использовать более точные методы
    if (fStatistic > 10) return 0.001;
    if (fStatistic > 5) return 0.01;
    if (fStatistic > 3) return 0.05;
    if (fStatistic > 2) return 0.1;
    return 0.2;
  }
}

