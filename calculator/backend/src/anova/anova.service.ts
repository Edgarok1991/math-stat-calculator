import { Injectable } from '@nestjs/common';
import { AnovaDto } from './dto/anova.dto';
import { AnovaResult, AnovaStep } from './interfaces/anova-result.interface';

@Injectable()
export class AnovaService {
  calculateAnova(data: AnovaDto): AnovaResult {
    const { groups, alpha, type = 'one-factor' } = data;

    if (groups.length < 2) {
      throw new Error('Необходимо минимум 2 группы');
    }

    if (type === 'multi-factor') {
      return this.calculateMultiFactorAnova(groups, alpha);
    }

    return this.calculateOneFactorAnova(groups, alpha);
  }

  private calculateOneFactorAnova(groups: number[][], alpha: number): AnovaResult {
    const groupMeans = groups.map((group) => this.calculateMean(group));
    const groupVariances = groups.map((group) => this.calculateVariance(group));
    const groupSizes = groups.map((group) => group.length);

    const totalSum = groups.reduce(
      (sum, group) => sum + group.reduce((a, b) => a + b, 0),
      0,
    );
    const totalCount = groups.reduce((sum, group) => sum + group.length, 0);
    const grandMean = totalSum / totalCount;

    // SSB — сумма квадратов между группами
    const ssb = groups.reduce((sum, group, i) => {
      const groupMean = groupMeans[i];
      return sum + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);

    // SSW — сумма квадратов внутри групп
    const ssw = groups.reduce((sum, group, i) => {
      const groupMean = groupMeans[i];
      return sum + group.reduce((groupSum, value) => {
        return groupSum + Math.pow(value - groupMean, 2);
      }, 0);
    }, 0);

    const sst = ssb + ssw;

    const dfBetween = groups.length - 1;
    const dfWithin = totalCount - groups.length;
    const dfTotal = totalCount - 1;

    const msb = ssb / dfBetween;
    const msw = ssw / dfWithin;

    const fStatistic = msb / msw;
    const criticalValue = this.calculateFCritical(dfBetween, dfWithin, alpha);
    const pValue = this.calculatePValue(fStatistic, dfBetween, dfWithin);
    const significant = fStatistic > criticalValue;

    const steps: AnovaStep[] = [
      {
        step: 1,
        title: 'Общее среднее (grand mean)',
        formula: 'x̄ = Σxᵢⱼ / N',
        description: 'Среднее значение по всем наблюдениям.',
        value: grandMean.toFixed(4),
        values: {
          totalSum: totalSum,
          totalCount: totalCount,
          grandMean: grandMean,
        },
      },
      {
        step: 2,
        title: 'Средние по группам',
        description: 'Вычисляем среднее для каждой группы.',
        values: Object.fromEntries(
          groupMeans.map((m, i) => [`Группа ${i + 1}`, m]),
        ),
      },
      {
        step: 3,
        title: 'Сумма квадратов между группами (SSB)',
        formula: 'SSB = Σ nⱼ(x̄ⱼ - x̄)²',
        description: `Для каждой группы: размер группы × (среднее группы - общее среднее)². Степени свободы: k - 1 = ${dfBetween}.`,
        value: ssb.toFixed(4),
        values: {
          ssb,
          dfBetween,
        },
      },
      {
        step: 4,
        title: 'Сумма квадратов внутри групп (SSW)',
        formula: 'SSW = Σ Σ(xᵢⱼ - x̄ⱼ)²',
        description: `Сумма квадратов отклонений наблюдений от среднего своей группы. Степени свободы: N - k = ${dfWithin}.`,
        value: ssw.toFixed(4),
        values: {
          ssw,
          dfWithin,
        },
      },
      {
        step: 5,
        title: 'Средние квадраты MSb и MSw',
        formula: 'MSb = SSB / (k-1),  MSw = SSW / (N-k)',
        description: 'Делим суммы квадратов на соответствующие степени свободы.',
        values: {
          msb,
          msw,
          formula: `MSb = ${ssb.toFixed(2)} / ${dfBetween} = ${msb.toFixed(4)},  MSw = ${ssw.toFixed(2)} / ${dfWithin} = ${msw.toFixed(4)}`,
        },
      },
      {
        step: 6,
        title: 'F-статистика',
        formula: 'F = MSb / MSw',
        description: `F-критерий: отношение межгрупповой дисперсии к внутригрупповой. F = ${msb.toFixed(4)} / ${msw.toFixed(4)} = ${fStatistic.toFixed(4)}.`,
        value: fStatistic.toFixed(4),
        values: { fStatistic, criticalValue, alpha },
      },
      {
        step: 7,
        title: 'Решение',
        description: significant
          ? `F = ${fStatistic.toFixed(4)} > Fкрит = ${criticalValue.toFixed(4)} при α = ${alpha}. Гипотеза H₀ отклоняется — различия между группами статистически значимы (p = ${pValue.toFixed(6)}).`
          : `F = ${fStatistic.toFixed(4)} ≤ Fкрит = ${criticalValue.toFixed(4)} при α = ${alpha}. Гипотеза H₀ не отклоняется — значимых различий не обнаружено (p = ${pValue.toFixed(6)}).`,
        values: { significant: significant ? 'да' : 'нет', pValue },
      },
    ];

    return {
      type: 'one-factor',
      fStatistic,
      pValue,
      criticalValue,
      significant,
      groupMeans,
      groupVariances,
      grandMean,
      ssb,
      ssw,
      sst,
      dfBetween,
      dfWithin,
      dfTotal,
      msb,
      msw,
      groupSizes,
      steps,
    };
  }

  private calculateMultiFactorAnova(groups: number[][], alpha: number): AnovaResult {
    const result = this.calculateOneFactorAnova(groups, alpha);
    const lastStep = result.steps?.[result.steps.length - 1];
    return {
      ...result,
      type: 'multi-factor',
      steps: [
        ...(result.steps || []).slice(0, -1),
        {
          step: 7,
          title: 'Многофакторный ANOVA',
          description: 'Многофакторный дисперсионный анализ (факторные планы, взаимодействия) в расширенной версии. Сейчас выполнен однофакторный анализ по представленным группам. Для полноценного двухфакторного ANOVA требуется таблица данных (строка × столбец).',
          values: {
            type: result.type,
            fStatistic: result.fStatistic,
            pValue: result.pValue,
            significant: result.significant ? 'да' : 'нет',
          },
        },
      ],
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateFCritical(df1: number, df2: number, alpha: number): number {
    const fTable: Record<number, Record<number, Record<number, number>>> = {
      0.01: {
        1: { 1: 4052, 2: 98.5, 3: 34.1, 4: 21.2, 5: 16.3, 8: 11.3, 10: 10.0, 12: 9.3, 15: 8.7, 20: 8.1, 24: 7.8, 30: 7.6, 40: 7.3, 60: 7.0, 120: 6.9 },
        2: { 1: 5000, 2: 99.0, 3: 30.8, 4: 18.0, 5: 13.3, 8: 8.7, 10: 7.6, 12: 6.9, 15: 6.4, 20: 5.8, 24: 5.6, 30: 5.4, 40: 5.2, 60: 5.0, 120: 4.8 },
        3: { 1: 5403, 2: 99.2, 3: 29.5, 4: 16.7, 5: 12.1, 8: 7.6, 10: 6.6, 12: 6.0, 15: 5.4, 20: 4.9, 24: 4.7, 30: 4.5, 40: 4.3, 60: 4.1, 120: 3.9 },
        4: { 1: 5625, 2: 99.2, 3: 28.7, 4: 15.8, 5: 11.4, 8: 6.8, 10: 6.0, 12: 5.4, 15: 4.9, 20: 4.4, 24: 4.2, 30: 4.0, 40: 3.8, 60: 3.6, 120: 3.5 },
        5: { 1: 5764, 2: 99.3, 3: 28.2, 4: 15.2, 5: 10.9, 8: 6.4, 10: 5.6, 12: 5.0, 15: 4.6, 20: 4.1, 24: 3.9, 30: 3.7, 40: 3.5, 60: 3.4, 120: 3.3 },
      },
      0.05: {
        1: { 1: 161.4, 2: 18.5, 3: 10.1, 4: 7.7, 5: 6.6, 8: 5.3, 10: 4.9, 12: 4.8, 15: 4.5, 20: 4.4, 24: 4.3, 30: 4.2, 40: 4.1, 60: 4.0, 120: 3.9 },
        2: { 1: 199.5, 2: 19.0, 3: 9.6, 4: 6.9, 5: 5.8, 8: 4.5, 10: 4.1, 12: 3.9, 15: 3.7, 20: 3.5, 24: 3.4, 30: 3.3, 40: 3.2, 60: 3.1, 120: 3.1 },
        3: { 1: 215.7, 2: 19.2, 3: 9.3, 4: 6.6, 5: 5.4, 8: 4.1, 10: 3.7, 12: 3.5, 15: 3.3, 20: 3.1, 24: 3.0, 30: 2.9, 40: 2.8, 60: 2.8, 120: 2.7 },
        4: { 1: 224.6, 2: 19.2, 3: 9.1, 4: 6.4, 5: 5.2, 8: 3.8, 10: 3.5, 12: 3.3, 15: 3.1, 20: 2.9, 24: 2.8, 30: 2.7, 40: 2.6, 60: 2.5, 120: 2.5 },
        5: { 1: 230.2, 2: 19.3, 3: 9.0, 4: 6.3, 5: 5.1, 8: 3.7, 10: 3.3, 12: 3.1, 15: 2.9, 20: 2.7, 24: 2.6, 30: 2.5, 40: 2.5, 60: 2.4, 120: 2.3 },
      },
      0.1: {
        1: { 1: 39.9, 2: 8.5, 3: 5.5, 4: 4.5, 5: 4.1, 8: 3.2, 10: 3.0, 12: 2.8, 15: 2.7, 20: 2.5, 24: 2.4, 30: 2.3, 40: 2.2, 60: 2.2, 120: 2.1 },
        2: { 1: 49.5, 2: 9.0, 3: 5.5, 4: 4.3, 5: 3.8, 8: 2.9, 10: 2.7, 12: 2.5, 15: 2.4, 20: 2.2, 24: 2.1, 30: 2.0, 40: 2.0, 60: 1.9, 120: 1.9 },
        3: { 1: 53.6, 2: 9.2, 3: 5.4, 4: 4.2, 5: 3.6, 8: 2.7, 10: 2.5, 12: 2.3, 15: 2.2, 20: 2.0, 24: 1.9, 30: 1.8, 40: 1.8, 60: 1.7, 120: 1.7 },
        4: { 1: 55.8, 2: 9.2, 3: 5.3, 4: 4.1, 5: 3.5, 8: 2.6, 10: 2.4, 12: 2.2, 15: 2.1, 20: 1.9, 24: 1.8, 30: 1.7, 40: 1.7, 60: 1.6, 120: 1.6 },
        5: { 1: 57.2, 2: 9.3, 3: 5.3, 4: 4.0, 5: 3.4, 8: 2.5, 10: 2.3, 12: 2.1, 15: 2.0, 20: 1.8, 24: 1.7, 30: 1.7, 40: 1.6, 60: 1.6, 120: 1.5 },
      },
    };

    const alphaKey = alpha as keyof typeof fTable;
    const df1Clamp = Math.min(Math.max(df1, 1), 5);
    const df2Keys = [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120];
    let df2Key = df2Keys[0];
    for (const k of df2Keys) {
      if (df2 <= k) {
        df2Key = k;
        break;
      }
      df2Key = k;
    }

    return (
      fTable[alphaKey]?.[df1Clamp]?.[df2Key] ??
      fTable[0.05]?.[df1Clamp]?.[12] ??
      3.89
    );
  }

  private calculatePValue(fStatistic: number, df1: number, df2: number): number {
    if (fStatistic <= 0) return 1;
    if (fStatistic > 50) return 0.00001;
    try {
      const x = df2 / (df2 + df1 * fStatistic);
      const p = 1 - this.regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
      return Math.max(0.00001, Math.min(0.99999, p));
    } catch {
      if (fStatistic > 10) return 0.001;
      if (fStatistic > 5) return 0.01;
      if (fStatistic > 3) return 0.05;
      if (fStatistic > 2) return 0.1;
      return 0.2;
    }
  }

  private regularizedIncompleteBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(
      this.lgamma(a + b) - this.lgamma(a) - this.lgamma(b) +
        a * Math.log(x) + b * Math.log(1 - x)
    );
    return x < (a + 1) / (a + b + 2)
      ? (bt * this.betacf(x, a, b)) / a
      : 1 - (bt * this.betacf(1 - x, b, a)) / b;
  }

  private betacf(x: number, a: number, b: number): number {
    const maxIt = 200;
    const eps = 3e-7;
    let m = 1;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;
    for (let i = 1; i <= maxIt; i++) {
      const m2 = 2 * m;
      const aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      h *= d * c;
      const aa2 = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa2 * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa2 / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < eps) break;
      m++;
    }
    return h;
  }

  private lgamma(z: number): number {
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - this.lgamma(1 - z);
    z -= 1;
    let x = 0.99999999999980993;
    const cof = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    for (let i = 0; i < 8; i++) x += cof[i] / (z + i + 1);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
}
