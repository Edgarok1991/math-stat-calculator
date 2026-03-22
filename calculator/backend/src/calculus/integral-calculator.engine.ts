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
 *
 * Ограничения: полный уровень Wolfram Alpha / SymPy в одном Node-процессе недостижим без внешнего CAS;
 * здесь максимально сильная связка **mathjs + nerdamer + явные правила + верификация**.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nerdamer = require('nerdamer');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Calculus.js');

export class IntegralCalculatorEngine {
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
    if (!nerdamerIntegrand?.trim() || !nerdamerAntiderivativeRaw?.trim()) return false;
    try {
      const diff = nerdamer(
        `diff((${nerdamerAntiderivativeRaw}), ${variable}) - (${nerdamerIntegrand})`
      ).simplify();
      const s = diff.toString();
      return s === '0' || s === '-0';
    } catch {
      return false;
    }
  }
}
