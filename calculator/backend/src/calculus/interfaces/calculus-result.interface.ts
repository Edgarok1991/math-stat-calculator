/** Правило (формула + подстановки) в стиле MathDF */
export interface IntegralStepRule {
  name: string;
  formula?: string;
  /** LaTeX для MathJax (дроби, интегралы) — предпочтительно для сложных формул */
  formulaLatex?: string;
  /** Пояснение к случаю, напр. «при n = 1» */
  caseNote?: string;
  substitutions?: Array<{ symbol: string; value: string }>;
}

/**
 * Тип блока как на mathdf.com: зелёная рамка — подстановка / обратная замена,
 * серая — правило (табличный интеграл), compute — стартовый интеграл, line — промежуточная строка.
 */
export type IntegralStepKind =
  | 'default'
  | 'compute'
  | 'substitution'
  | 'backsubstitution'
  | 'rule'
  | 'line'
  | 'result';

/** Структурированный шаг решения в стиле MathDF */
export interface IntegralStepStructured {
  actionLabel?: string;
  stepKind?: IntegralStepKind;
  /** Красная ссылка [1], [2] … как на MathDF */
  referenceTag?: string;
  /** Строка под бейджем (часто ∫ f(x) dx) */
  expression?: string;
  expressionLatex?: string;
  rule?: IntegralStepRule;
  /** После раскрытия карточки правила — результат подстановки */
  expressionAfter?: string;
  expressionAfterLatex?: string;
  subSteps?: IntegralStepStructured[];
}

export interface CalculusResult {
  result: string;
  steps: string[];
  latex: string;
  /** Пошаговое решение в формате MathDF (опционально) */
  stepsStructured?: IntegralStepStructured[];
}

