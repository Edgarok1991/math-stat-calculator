export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface RegressionData {
  x: number[];
  y: number[];
  type: 'linear' | 'polynomial' | 'exponential';
  degree?: number;
}

export interface RegressionResult {
  coefficients: number[];
  rSquared: number;
  equation: string;
  predictions: number[];
  residuals: number[];
}

export interface ClusteringData {
  points: number[][];
  k: number;
  method: 'kmeans' | 'hierarchical' | 'single' | 'complete' | 'average';
}

export interface ClusteringResult {
  clusters: number[][];
  centroids: number[][];
  labels: number[];
  inertia: number;
  steps?: ClusteringStep[];
  method?: string;
  dendrogramData?: DendrogramNode;
  initialDistanceMatrix?: number[][];
  finalDistance?: number;
}

export interface ClusteringStep {
  step: number;
  action: string;
  clusters: number[][];
  clusterLabels?: string[];
  distances: number[][];
  mergedClusters?: [number, number];
  minDistance?: number;
  minDistanceIndices?: [number, number];
  newCentroid?: number[];
  description: string;
  detailedDescription?: string;
  remainingClusters?: number;
}

export interface DendrogramNode {
  name: string;
  children?: DendrogramNode[];
  distance?: number;
  height?: number;
}

export interface AnovaData {
  groups: number[][];
  alpha: number;
  type?: 'one-factor' | 'multi-factor';
}

export interface AnovaStep {
  step: number;
  title: string;
  formula?: string;
  description: string;
  value?: string;
  values?: Record<string, number | string | boolean>;
}

export interface AnovaResult {
  type?: 'one-factor' | 'multi-factor';
  fStatistic: number;
  pValue: number;
  criticalValue: number;
  significant: boolean;
  groupMeans: number[];
  groupVariances: number[];
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

export interface GaussStep {
  step: number;
  description: string;
  matrix: (number | string)[][];
  operation?: 'swap' | 'eliminate' | 'back_substitute' | 'normalize' | 'solution' | string;
  pivot?: { row: number; col: number };
  factor?: number;
  targetRow?: number;
  sourceRow?: number;
}

export interface GaussResult {
  solution: (number | string)[];
  steps: string[];
  detailedSteps?: GaussStep[];
  determinant: number | string | {
    determinant: number | string;
    rank: number;
  };
  rank: number;
  solutionType?: 'unique' | 'infinite' | 'none';
  message?: string;
}

export interface CalculusData {
  expression: string;
  variable: string;
  type: 'derivative' | 'integral';
  bounds?: { lower: number; upper: number };
}

export interface CalculusResult {
  result: string;
  steps: string[];
  latex: string;
}

