export interface GaussStep {
  step: number;
  description: string;
  matrix: (number | string)[][];
  operation?: 'swap' | 'eliminate' | 'back_substitute' | 'normalize' | 'solution';
  pivot?: { row: number; col: number };
  factor?: number;
  targetRow?: number;
  sourceRow?: number;
}

export interface GaussResult {
  solution: (number | string)[];
  steps: string[];
  detailedSteps?: GaussStep[];
  determinant: {
    determinant: number | string;
    rank: number;
  };
  rank: number;
  solutionType?: 'unique' | 'infinite' | 'none';
  message?: string;
}

