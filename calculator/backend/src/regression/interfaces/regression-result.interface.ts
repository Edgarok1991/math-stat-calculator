export interface RegressionResult {
  coefficients: number[];
  rSquared: number;
  equation: string;
  predictions: number[];
  residuals: number[];
}

