/** Правило (формула + подстановки) в стиле MathDF */
export interface IntegralStepRule {
  name: string;
  formula?: string;
  substitutions?: Array<{ symbol: string; value: string }>;
}

/** Структурированный шаг решения в стиле MathDF */
export interface IntegralStepStructured {
  actionLabel?: string;
  /** Строка под бейджем (часто ∫ f(x) dx) */
  expression?: string;
  rule?: IntegralStepRule;
  /** После раскрытия карточки правила — результат подстановки */
  expressionAfter?: string;
  subSteps?: IntegralStepStructured[];
}

export interface CalculusResult {
  result: string;
  steps: string[];
  latex: string;
  /** Пошаговое решение в формате MathDF (опционально) */
  stepsStructured?: IntegralStepStructured[];
}

