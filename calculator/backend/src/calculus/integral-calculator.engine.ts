/**
 * Интегральный движок приложения (символьное интегрирование + контроль качества).
 *
 * **Цепочка в `CalculusService.calculateIntegral` (неопределённый интеграл):**
 * 1. Нормализация ввода (`e^x` → `exp(x)`, `ln` и т.д.).
 * 2. Правило-движок: табличные интегралы, подстановки, интегрирование по частям, явные шаблоны.
 * 3. Рациональные дроби: многочлен степени ≤2 / линейный знаменатель — деление в mathjs + почленное интегрирование
 *    (подробные шаги MathDF; обходит известные ошибки CAS).
 * 4. **Nerdamer** (символьная алгебра + Calculus.js) как универсальный CAS.
 * 5. Повторная попытка деления многочленов после CAS (если CAS дал ответ, но шаги перезаписываются корректным результатом).
 *
 * **Определённый интеграл:** Ньютон—Лейбниц (если первообразная известна) → рациональная (многочлен)/(линейный) + пределы
 * → **defint** в Nerdamer (`expand` / `factor`) → численно **метод Симпсона** (512 отрезков).
 *
 * **Защита:** для неопределённого интеграла результат Nerdamer проверяется условием
 * `d/dx(F) − f ≡ 0` в CAS. Если проверка не проходит — ответ CAS отбрасывается, срабатывают запасные правила.
 * Перед выдачей ответа пользователю выполняется **вторая проверка в mathjs** (derivative + simplify): так отсекаются
 * ложные ответы со спецфункциями (Ci, …) и расхождения CAS. Та же nerdamer-проверка может выводиться в пошаговом решении.
 *
 * **Пошаговый вывод:** для путей Nerdamer указывается стратегия `direct` / `expand` / `factor`; для определённого
 * интеграла при согласованности `defint` и `F(b)-F(a)` показывается цепочка Ньютона—Лейбница.
 *
 * Ограничения: уровень Rubi / полного SymPy в одном Node-процессе недостижим без внешнего CAS;
 * здесь максимально сильная связка **mathjs + nerdamer + явные правила + верификация**.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nerdamer = require('nerdamer');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Calculus.js');

/** Какую алгебраическую подготовку применил CAS перед integrate/defint (как у крупных решателей: упрощение структуры). */
export type CasIntegralStrategy = 'direct' | 'expand' | 'factor';

export class IntegralCalculatorEngine {
  static describeCasStrategy(strategy: CasIntegralStrategy): string {
    switch (strategy) {
      case 'direct':
        return 'Прямое символьное интегрирование без предварительного переписывания выражения.';
      case 'expand':
        return 'Сначала раскрыты скобки (expand), затем интегрирование — удобно для произведений и сумм.';
      case 'factor':
        return 'Сначала вынесены общие множители (factor), затем интегрирование — удобно для сокращения структуры.';
      default:
        return '';
    }
  }

  static casStrategyTitle(strategy: CasIntegralStrategy): string {
    switch (strategy) {
      case 'direct':
        return 'CAS: integrate / defint';
      case 'expand':
        return 'CAS: expand → integrate / defint';
      case 'factor':
        return 'CAS: factor → integrate / defint';
      default:
        return 'CAS';
    }
  }

  /**
   * Остаток d/dx(F) − f после simplify в Nerdamer (для отображения шага проверки).
   */
  static verificationResidualRaw(
    nerdamerIntegrand: string,
    variable: string,
    nerdamerAntiderivativeRaw: string
  ): string | null {
    if (!nerdamerIntegrand?.trim() || !nerdamerAntiderivativeRaw?.trim()) return null;
    try {
      const diff = nerdamer(
        `diff((${nerdamerAntiderivativeRaw}), ${variable}) - (${nerdamerIntegrand})`
      ).simplify();
      return diff.toString();
    } catch {
      return null;
    }
  }

  /**
   * Проверка: производная предложенной первообразной совпадает с подынтегральным выражением (в формате Nerdamer).
   * @param nerdamerIntegrand выражение f(x) в синтаксисе `toNerdamerExpr`
   * @param nerdamerAntiderivativeRaw F(x) без «+ C», как строка из `result.toString()` после integrate
   */
  static verifyIndefiniteAntiderivative(
    nerdamerIntegrand: string,
    variable: string,
    nerdamerAntiderivativeRaw: string
  ): boolean {
    const r = IntegralCalculatorEngine.verificationResidualRaw(
      nerdamerIntegrand,
      variable,
      nerdamerAntiderivativeRaw
    );
    return r === '0' || r === '-0';
  }
}
