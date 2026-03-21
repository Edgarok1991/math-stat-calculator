export interface AnovaStep {
  step: number;
  title: string;
  formula?: string;
  description: string;
  value?: string;
  values?: Record<string, number | string | boolean>;
}

export interface AnovaResult {
  type: 'one-factor' | 'multi-factor';
  fStatistic: number;
  pValue: number;
  criticalValue: number;
  significant: boolean;
  groupMeans: number[];
  groupVariances: number[];
  /** One-factor: SSB, SSW, SST, dfBetween, dfWithin, dfTotal, MSb, MSw, grandMean */
  grandMean?: number;
  ssb?: number;
  ssw?: number;
  sst?: number;
  dfBetween?: number;
  dfWithin?: number;
  dfTotal?: number;
  msb?: number;
  msw?: number;
  groupSizes?: number[];
  steps?: AnovaStep[];
}

