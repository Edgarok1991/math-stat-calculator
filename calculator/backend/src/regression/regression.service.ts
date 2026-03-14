import { Injectable } from '@nestjs/common';
import { RegressionDto } from './dto/regression.dto';
import { RegressionResult } from './interfaces/regression-result.interface';
import * as math from 'mathjs';

@Injectable()
export class RegressionService {
  calculateRegression(data: RegressionDto): RegressionResult {
    const { x, y, type, degree = 2 } = data;

    if (x.length !== y.length) {
      throw new Error('Количество значений X и Y должно совпадать');
    }

    switch (type) {
      case 'linear':
        return this.linearRegression(x, y);
      case 'polynomial':
        return this.polynomialRegression(x, y, degree);
      case 'exponential':
        return this.exponentialRegression(x, y);
      default:
        throw new Error('Неподдерживаемый тип регрессии');
    }
  }

  private linearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    
    const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = y.reduce((sum, yi) => sum + (yi - sumY / n) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    return {
      coefficients: [intercept, slope],
      rSquared,
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      predictions,
      residuals,
    };
  }

  private polynomialRegression(x: number[], y: number[], degree: number): RegressionResult {
    const n = x.length;
    const X = this.createVandermondeMatrix(x, degree);
    const Y = y;

    // Решение системы нормальных уравнений: X^T * X * coeffs = X^T * Y
    const XT = this.transposeMatrix(X);
    const XTX = this.multiplyMatrices(XT, X);
    const XTY = this.multiplyMatrixVector(XT, Y);
    
    const coefficients = this.solveLinearSystem(XTX, XTY);

    const predictions = x.map(xi => {
      let result = 0;
      for (let i = 0; i < coefficients.length; i++) {
        result += coefficients[i] * Math.pow(xi, i);
      }
      return result;
    });

    const residuals = y.map((yi, i) => yi - predictions[i]);
    
    const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = y.reduce((sum, yi) => sum + (yi - y.reduce((a, b) => a + b, 0) / n) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    const equation = this.buildPolynomialEquation(coefficients);

    return {
      coefficients,
      rSquared,
      equation,
      predictions,
      residuals,
    };
  }

  private exponentialRegression(x: number[], y: number[]): RegressionResult {
    // Преобразование: ln(y) = ln(a) + b*x
    const logY = y.map(yi => Math.log(yi));
    const linearResult = this.linearRegression(x, logY);
    
    const a = Math.exp(linearResult.coefficients[0]);
    const b = linearResult.coefficients[1];

    const predictions = x.map(xi => a * Math.exp(b * xi));
    const residuals = y.map((yi, i) => yi - predictions[i]);
    
    const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = y.reduce((sum, yi) => sum + (yi - y.reduce((a, b) => a + b, 0) / y.length) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    return {
      coefficients: [a, b],
      rSquared,
      equation: `y = ${a.toFixed(4)}e^(${b.toFixed(4)}x)`,
      predictions,
      residuals,
    };
  }

  private createVandermondeMatrix(x: number[], degree: number): number[][] {
    return x.map(xi => {
      const row: number[] = [];
      for (let i = 0; i <= degree; i++) {
        row.push(Math.pow(xi, i));
      }
      return row;
    });
  }

  private transposeMatrix(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const result = Array(a.length).fill(null).map(() => Array(b[0].length).fill(0));
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b[0].length; j++) {
        for (let k = 0; k < b.length; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Прямой ход метода Гаусса
    for (let i = 0; i < n; i++) {
      // Поиск максимального элемента в столбце
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Обмен строк
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Обнуление столбца
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Обратный ход
    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }
    
    return solution;
  }

  private buildPolynomialEquation(coefficients: number[]): string {
    const terms = coefficients.map((coeff, i) => {
      if (i === 0) return coeff.toFixed(4);
      if (i === 1) return `${coeff.toFixed(4)}x`;
      return `${coeff.toFixed(4)}x^${i}`;
    });
    
    return `y = ${terms.join(' + ')}`;
  }
}

