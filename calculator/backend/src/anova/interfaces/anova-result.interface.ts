export interface AnovaResult {
  fStatistic: number;
  pValue: number;
  criticalValue: number;
  significant: boolean;
  groupMeans: number[];
  groupVariances: number[];
}

