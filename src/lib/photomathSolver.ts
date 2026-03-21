/**
 * Решение сложных математических выражений: арифметика, производные, интегралы.
 * Конвертация LaTeX в формат, понятный mathjs и API.
 */
import { evaluate } from 'mathjs';

export type SolveResult =
  | { type: 'arithmetic'; value: string; steps?: string[] }
  | { type: 'derivative'; result: any; steps?: any[] }
  | { type: 'integral'; result: any; steps?: any[] }
  | { type: 'error'; message: string };

/** Конвертация LaTeX и OCR-текста в выражение для mathjs */
export function latexToMathjs(s: string): string {
  let t = (s || '').trim();
  if (!t) return '';
  // LaTeX -> plain
  t = t.replace(/\\pi/g, 'pi');
  t = t.replace(/\\infty/g, 'Infinity');
  t = t.replace(/\\times/g, '*');
  t = t.replace(/\\cdot/g, '*');
  t = t.replace(/\\div/g, '/');
  t = t.replace(/\\pm/g, '+');
  t = t.replace(/\\mp/g, '-');
  t = t.replace(/\\left\s*/g, '');
  t = t.replace(/\\right\s*/g, '');
  // \frac{a}{b} -> (a)/(b)
  t = t.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '($1)/($2)');
  t = t.replace(/\\dfrac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '($1)/($2)');
  // \sqrt{x} -> sqrt(x), \sqrt[n]{x} -> nthRoot(x,n)
  t = t.replace(/\\sqrt\s*\{([^}]*)\}/g, 'sqrt($1)');
  t = t.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^}]*)\}/g, 'nthRoot($2,$1)');
  // x^{n} -> x^n, x^2
  t = t.replace(/\^?\s*\{([^}]*)\}/g, '^($1)');
  t = t.replace(/\\log\s*\(/g, 'log10(');
  t = t.replace(/\\ln\s*\(/g, 'log(');
  t = t.replace(/\\sin\s*\(/g, 'sin(');
  t = t.replace(/\\cos\s*\(/g, 'cos(');
  t = t.replace(/\\tan\s*\(/g, 'tan(');
  t = t.replace(/\\sqrt\s*\(/g, 'sqrt(');
  t = t.replace(/\\abs\s*\{([^}]*)\}/g, 'abs($1)');
  t = t.replace(/\\left\|([^|]*)\\\right\|/g, 'abs($1)');
  // √, ×, ÷, π (Unicode)
  t = t.replace(/√(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  t = t.replace(/√\(/g, 'sqrt(');
  t = t.replace(/×/g, '*');
  t = t.replace(/÷/g, '/');
  t = t.replace(/π/g, 'pi');
  t = t.replace(/—/g, '-');
  t = t.replace(/–/g, '-');
  t = t.replace(/\s+/g, '');
  return t;
}

/** Определяет тип задачи: integral, derivative или arithmetic */
export function detectTaskType(expr: string): 'integral' | 'derivative' | 'arithmetic' {
  const e = expr.toLowerCase();
  if (/\int|\\int|∫/.test(e) || /integral/.test(e)) return 'integral';
  if (/\\frac\s*\{?\s*d\s*\}?\{?\s*d\w+\s*\}?|d\/dx|derivative|'\(|\bderive\b/.test(e)) return 'derivative';
  return 'arithmetic';
}

/** Парсинг интеграла: ∫ f dx, \int f dx, integral f dx, ∫_a^b f dx */
export function parseIntegral(expr: string): { f: string; var: string; lower?: number; upper?: number } | null {
  const e = expr.trim();
  // ∫_a^b f dx или \int_a^b f dx
  const bounded = e.match(/[∫\\]int\s*_?\s*\{?([^}\s^_]+)\}?\s*\^?\s*\{?([^}\s]+)\}?\s*(.+)/i);
  if (bounded) {
    const a = parseFloat(bounded[1]);
    const b = parseFloat(bounded[2]);
    const rest = bounded[3];
    const dx = rest.match(/(.+?)\s*d\s*(\w+)\s*$/i);
    if (dx && !isNaN(a) && !isNaN(b)) {
      return { f: latexToMathjs(dx[1].trim()), var: dx[2].toLowerCase(), lower: a, upper: b };
    }
  }
  // ∫ f dx, \int f dx, integral f dx, "x^2 dx"
  const simple = e.match(/(?:∫|[\\]int|integral)\s*(.+?)\s*d\s*(\w+)\s*$/i)
    || e.match(/(.+?)\s*d\s*(\w+)\s*$/i);
  if (simple) {
    return { f: latexToMathjs(simple[1].trim()), var: simple[2].toLowerCase() };
  }
  const fallback = e.replace(/.*(?:∫|[\\]int|integral)\s*/i, '').replace(/\s*d\s*\w+\s*$/i, '');
  return { f: latexToMathjs(fallback || e), var: 'x' };
}

/** Парсинг производной: d/dx(f), d/dx f, f'(x), \frac{d}{dx}(f) */
export function parseDerivative(expr: string): { f: string; var: string } | null {
  const dm = expr.match(/d\s*\/\s*d\s*(\w+)\s*[\(\[]?\s*([^)\]]+)[\)\]]?|\\frac\s*\{d\}\s*\{d\s*(\w+)\}\s*[\(\[]?([^)\]]*)[\)\]]?/i);
  if (dm) {
    const v = (dm[1] || dm[3] || 'x').toLowerCase();
    const f = (dm[2] || dm[4] || '').trim();
    if (f) return { f: latexToMathjs(f), var: v };
  }
  const pm = expr.match(/(.+?)'\s*\(?\s*(\w+)\s*\)?/);
  if (pm) return { f: latexToMathjs(pm[1].trim()), var: (pm[2] || 'x').toLowerCase() };
  const stripped = expr.replace(/.*d\s*\/\s*d\s*\w+\s*[\(\[]?|.*\\frac\s*\{d\}.*?[\(\[]/gi, '').replace(/[\)\]]\s*$/g, '');
  if (stripped) return { f: latexToMathjs(stripped.trim()), var: 'x' };
  return null;
}

/** Арифметика через mathjs */
function solveArithmetic(expr: string): SolveResult {
  const normalized = latexToMathjs(expr);
  if (!normalized) return { type: 'error', message: 'Пустое выражение' };
  try {
    const result = evaluate(normalized);
    const str = String(typeof result === 'number' && !Number.isNaN(result) ? result : result);
    return { type: 'arithmetic', value: str };
  } catch {
    return { type: 'error', message: 'Не удалось вычислить выражение' };
  }
}

/** Решение с роутингом на integral/derivative/arithmetic */
export async function solveComplex(
  expr: string,
  apiCall: {
    derivative: (data: { expression: string; variable: string }) => Promise<any>;
    integral: (data: { expression: string; variable: string; integralType?: 'indefinite' | 'definite'; lowerBound?: number; upperBound?: number }) => Promise<any>;
  }
): Promise<SolveResult> {
  const type = detectTaskType(expr);

  if (type === 'integral') {
    const parsed = parseIntegral(expr);
    if (!parsed) return solveArithmetic(expr);
    try {
      const res = await apiCall.integral({
        expression: parsed.f,
        variable: parsed.var,
        integralType: parsed.lower != null && parsed.upper != null ? 'definite' : 'indefinite',
        lowerBound: parsed.lower,
        upperBound: parsed.upper,
      });
      return { type: 'integral', result: res, steps: res.steps };
    } catch {
      return solveArithmetic(expr);
    }
  }

  if (type === 'derivative') {
    const parsed = parseDerivative(expr);
    if (!parsed) return solveArithmetic(expr);
    try {
      const res = await apiCall.derivative({ expression: parsed.f, variable: parsed.var });
      return { type: 'derivative', result: res, steps: (res as any).steps };
    } catch {
      return solveArithmetic(expr);
    }
  }

  return solveArithmetic(expr);
}
