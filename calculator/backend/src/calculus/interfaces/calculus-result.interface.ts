/** Правило (формула + подстановки) в стиле MathDF */
export interface IntegralStepRule {
  name: string;
  formula?: string;
  substitutions?: Array<{ symbol: string; value: string }>;
}

/** Структурированный шаг решения в стиле MathDF */
export interface IntegralStepStructured {
  actionLabel?: string;
  rule?: IntegralStepRule;
  expression?: string;
  subSteps?: IntegralStepStructured[];
}

export interface CalculusResult {
  result: string;
  steps: string[];
  latex: string;
  /** Пошаговое решение в формате MathDF (опционально) */
  stepsStructured?: IntegralStepStructured[];
}

