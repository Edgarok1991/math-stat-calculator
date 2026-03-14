export interface DerivativeStep {
  step: number;
  rule: string; // Название правила (например, "Правило произведения")
  expression: string; // Выражение на этом шаге
  explanation: string; // Объяснение шага
}

export interface DerivativeResult {
  original: string; // Исходная функция
  derivative: string; // Результат (производная)
  simplified?: string; // Упрощённая производная
  steps: DerivativeStep[]; // Пошаговое решение
  variable: string; // Переменная дифференцирования
  order: number; // Порядок производной
}

export interface DerivativeGraphResult extends DerivativeResult {
  graphData: {
    original: Array<{ x: number; y: number }>;
    derivative: Array<{ x: number; y: number }>;
    xMin: number;
    xMax: number;
  };
}

export interface DerivativeAtPointResult {
  original: string;
  derivative: string;
  point: number;
  value: number; // Значение производной в точке
  functionValue: number; // Значение функции в точке
  tangentLine: string; // Уравнение касательной
}

