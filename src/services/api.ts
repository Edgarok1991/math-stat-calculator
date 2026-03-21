import { API_URL } from '@/config';

const API_BASE_URL = API_URL;

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API Request:', { url, config, body: config.body });
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', { status: response.status, text: errorText, url });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Success Response:', result);
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Регрессионный анализ
  async calculateRegression(data: {
    x: number[];
    y: number[];
    type: 'linear' | 'polynomial' | 'exponential';
    degree?: number;
  }): Promise<{
    coefficients: number[];
    rSquared: number;
    equation: string;
    predictions: number[];
    residuals: number[];
  }> {
    return this.request('/regression/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Кластерный анализ
  async calculateClustering(data: {
    points: number[][];
    k: number;
    method: 'kmeans' | 'hierarchical' | 'single' | 'complete' | 'average';
  }): Promise<{
    clusters: number[][];
    centroids: number[][];
    labels: number[];
    inertia: number;
    steps?: Array<{
      step: number;
      action: string;
      clusters: number[][];
      distances: number[][];
      mergedClusters?: [number, number];
      newCentroid?: number[];
      description: string;
    }>;
    method?: string;
  }> {
    return this.request('/clustering/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async photomathOcr(imageBase64: string): Promise<{ latex?: string; text?: string; error?: string }> {
    return this.request('/photomath/ocr', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    });
  }

  // Сохранение в историю (требует авторизации)
  async saveToHistory(
    token: string,
    data: { type: string; input: unknown; result: unknown },
  ): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // ANOVA
  async calculateAnova(data: {
    groups: number[][];
    alpha: number;
    type?: 'one-factor' | 'multi-factor';
  }): Promise<import('@/types/calculator').AnovaResult> {
    return this.request('/anova/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Решение матриц методом Гаусса
  async solveGauss(data: {
    matrix: number[][];
    vector: number[];
  }): Promise<{
    solution: (number | string)[];
    steps: string[];
    detailedSteps?: Array<{
      step: number;
      description: string;
      matrix: (number | string)[][];
      operation?: string;
      pivot?: { row: number; col: number };
      factor?: number;
      targetRow?: number;
      sourceRow?: number;
    }>;
    determinant: {
      determinant: number | string;
      rank: number;
    };
    rank: number;
  }> {
    return this.request('/matrices/gauss', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Обратная матрица
  async calculateInverse(data: {
    matrix: number[][];
  }): Promise<{
    inverse: number[][];
    determinant: any;
    steps: string[];
    detailedSteps?: Array<{
      step: number;
      description: string;
      matrix: (number | string)[][];
      operation?: string;
      pivot?: { row: number; col: number };
      factor?: number;
      targetRow?: number;
      sourceRow?: number;
    }>;
  }> {
    return this.request('/matrices/inverse', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Определитель матрицы
  async calculateDeterminant(data: {
    matrix: number[][];
    method?: string; // 'laplace', 'sarrus', 'triangle'
    laplaceType?: string; // 'row' или 'column'
    laplaceIndex?: number; // номер строки/столбца (0-based)
  }): Promise<{
    solution?: number[];
    steps: string[];
    determinant: number;
    rank: number;
    detailedSteps?: Array<{
      step: number;
      description: string;
      matrix: (number | string)[][];
      operation?: string;
      pivot?: { row: number; col: number };
      factor?: number;
      targetRow?: number;
      sourceRow?: number;
    }>;
  }> {
    return this.request('/matrices/determinant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Умножение матрицы на вектор
  async multiplyByVector(data: {
    matrix: number[][];
    vector: number[];
  }): Promise<{
    solution: number[];
    steps: string[];
    determinant: number;
    rank: number;
  }> {
    // Используем endpoint в app.controller.ts
    return this.request('/multiply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Новое: умножение двух матриц A(m×n) * B(n×p)
  async multiplyMatrices(data: {
    matrixA: number[][];
    matrixB: number[][];
  }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/multiply-matrices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Новые операции матриц (как на OnlineMSchool)
  async addMatrices(data: { matrixA: number[][]; matrixB: number[][] }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/add', { method: 'POST', body: JSON.stringify(data) });
  }
  async subtractMatrices(data: { matrixA: number[][]; matrixB: number[][] }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/subtract', { method: 'POST', body: JSON.stringify(data) });
  }
  async transposeMatrix(data: { matrix: number[][] }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/transpose', { method: 'POST', body: JSON.stringify(data) });
  }
  async scalarMultiply(data: { matrix: number[][]; k: number }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/scalar', { method: 'POST', body: JSON.stringify(data) });
  }
  async matrixPower(data: { matrix: number[][]; power: number }): Promise<{ result: number[][]; steps: string[]; detailedSteps?: any[] }> {
    return this.request('/matrices/power', { method: 'POST', body: JSON.stringify(data) });
  }
  async matrixRank(data: { matrix: number[][] }): Promise<{ rank: number; steps: string[] }> {
    return this.request('/matrices/rank', { method: 'POST', body: JSON.stringify(data) });
  }

  // Производная
  async calculateDerivative(data: {
    expression: string;
    variable: string;
  }) {
    return this.request('/calculus/derivative', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Интеграл
  async calculateIntegral(data: {
    expression: string;
    variable: string;
    integralType?: 'indefinite' | 'definite';
    lowerBound?: number;
    upperBound?: number;
  }) {
    // Преобразуем формат для backend
    const payload: any = {
      expression: data.expression,
      variable: data.variable,
      type: 'integral'
    };

    // Добавляем bounds только для определённого интеграла
    if (data.integralType === 'definite' && 
        data.lowerBound !== undefined && 
        data.upperBound !== undefined) {
      payload.bounds = {
        lower: data.lowerBound,
        upper: data.upperBound
      };
    }

    return this.request('/calculus/integral', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Описательная статистика
  async calculateDescriptiveStatistics(data: number[]): Promise<{
    mean: number;
    median: number;
    mode: number[];
    range: number;
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
    variance: number;
    stdDev: number;
    min: number;
    max: number;
    count: number;
    sum: number;
    outliers: number[];
    lowerFence: number;
    upperFence: number;
    histogram: Array<{ range: [number, number]; count: number; frequency: number }>;
    sortedData: number[];
  }> {
    return this.request('/statistics/descriptive', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  // 2D график функции
  async calculate2DGraph(data: {
    expression: string;
    xMin: number;
    xMax: number;
    points?: number;
  }): Promise<{
    points: Array<{ x: number; y: number }>;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  }> {
    return this.request('/statistics/graph-2d', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 3D график функции
  async calculate3DGraph(data: {
    expression: string;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    points?: number;
  }): Promise<{
    points: Array<{ x: number; y: number; z: number }>;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
  }> {
    return this.request('/statistics/graph-3d', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Производные с пошаговым решением
  async calculateDerivativeDetailed(data: {
    expression: string;
    variable: string;
    order?: number;
    simplify?: boolean;
  }): Promise<{
    original: string;
    derivative: string;
    simplified?: string;
    steps: Array<{
      step: number;
      rule: string;
      expression: string;
      explanation: string;
    }>;
    variable: string;
    order: number;
  }> {
    return this.request('/calculus/derivative/detailed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculateDerivativeWithGraph(data: {
    expression: string;
    variable: string;
    order?: number;
    simplify?: boolean;
    xMin?: number;
    xMax?: number;
  }): Promise<{
    original: string;
    derivative: string;
    simplified?: string;
    steps: Array<{
      step: number;
      rule: string;
      expression: string;
      explanation: string;
    }>;
    variable: string;
    order: number;
    graphData: {
      original: Array<{ x: number; y: number }>;
      derivative: Array<{ x: number; y: number }>;
      xMin: number;
      xMax: number;
    };
  }> {
    return this.request('/calculus/derivative/graph', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculateDerivativeAtPoint(data: {
    expression: string;
    variable: string;
    point: number;
    order?: number;
  }): Promise<{
    original: string;
    derivative: string;
    point: number;
    value: number;
    functionValue: number;
    tangentLine: string;
  }> {
    return this.request('/calculus/derivative/at-point', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();

