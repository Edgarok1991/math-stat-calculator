import { Injectable } from '@nestjs/common';
import { CalculusDto } from './dto/calculus.dto';
import { DerivativeDto, DerivativeAtPointDto } from './dto/derivative.dto';
import { CalculusResult, IntegralStepStructured } from './interfaces/calculus-result.interface';
import { IntegralCalculatorEngine } from './integral-calculator.engine';
import { DerivativeResult, DerivativeGraphResult, DerivativeAtPointResult, DerivativeStep } from './interfaces/derivative-result.interface';
import * as math from 'mathjs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nerdamer = require('nerdamer');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Calculus.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Algebra.js');

@Injectable()
export class CalculusService {
  // Новый метод для вычисления производной с пошаговым решением
  /** Нормализует ввод: lnx→ln(x), e^x→exp(x) */
  private normalizeExpression(expr: string): string {
    return expr
      .replace(/\bln\s*([a-z])\b/g, 'ln($1)')
      .replace(/\blog\s*([a-z])\b/g, 'log($1)')
      .replace(/\be\^([a-z0-9()+*\-.\s^]+)/g, (_, e) => `exp(${e.trim()})`);
  }

  calculateDerivativeDetailed(data: DerivativeDto): DerivativeResult {
    const { expression, variable, order = 1, simplify = true } = data;
    const normalizedExpr = this.normalizeExpression(expression);
    
    try {
      // Преобразуем выражение для совместимости с mathjs
      let processedExpression = normalizedExpr
        .replace(/ln\(/g, 'log(')  // ln -> log для mathjs
        .replace(/tg\(/g, 'tan(')  // tg -> tan для mathjs
        .replace(/ctg\(/g, 'cot(') // ctg -> cot для mathjs
        .replace(/arctg\(/g, 'atan(') // arctg -> atan
        .replace(/arcsin\(/g, 'asin(')
        .replace(/arccos\(/g, 'acos(');
      
      // Парсим выражение
      const node = math.parse(processedExpression);
      
      // Вычисляем производную указанного порядка
      let derivativeNode = node;
      const allSteps: DerivativeStep[] = [];
      
      for (let i = 0; i < order; i++) {
        const steps = this.getDetailedDerivativeSteps(derivativeNode, variable, i + 1);
        allSteps.push(...steps);
        derivativeNode = math.derivative(derivativeNode, variable);
      }
      
      // Упрощаем результат если нужно
      const derivativeStr = derivativeNode.toString();
      let simplifiedStr = derivativeStr;
      
      if (simplify) {
        try {
          simplifiedStr = math.simplify(derivativeNode).toString();
        } catch {
          simplifiedStr = derivativeStr;
        }
      }

      // Добавляем финальный шаг с результатом
      allSteps.push({
        step: allSteps.length + 1,
        rule: 'Итоговый результат',
        expression: simplifiedStr,
        explanation: simplify && simplifiedStr !== derivativeStr
          ? `После упрощения получаем окончательный результат производной: ${simplifiedStr}`
          : `Окончательный результат производной ${order === 1 ? '' : `${order}-го порядка `}по переменной ${variable}: ${simplifiedStr}`,});

      return {
        original: expression,
        derivative: derivativeStr,
        simplified: simplify ? simplifiedStr : undefined,
        steps: allSteps,
        variable,
        order,
      };
    } catch (error) {
      throw new Error(`Ошибка вычисления производной: ${error.message}`);
    }
  }

  // Метод для вычисления производной с графиками
  calculateDerivativeWithGraph(data: DerivativeDto): DerivativeGraphResult {
    const derivativeResult = this.calculateDerivativeDetailed(data);
    const { xMin = -10, xMax = 10 } = data;
    const numPoints = 200;
    const step = (xMax - xMin) / numPoints;

    // Преобразуем выражение для вычисления
    const processedExpression = this.normalizeExpression(data.expression)
      .replace(/ln\(/g, 'log(')
      .replace(/tg\(/g, 'tan(')
      .replace(/ctg\(/g, 'cot(')
      .replace(/arctg\(/g, 'atan(')
      .replace(/arcsin\(/g, 'asin(')
      .replace(/arccos\(/g, 'acos(');

    const originalData: Array<{ x: number; y: number }> = [];
    const derivativeData: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      
      try {
        // Вычисляем значение функции
        const yOriginal = math.evaluate(processedExpression, { [data.variable]: x });
        if (typeof yOriginal === 'number' && isFinite(yOriginal)) {
          originalData.push({ x, y: yOriginal });
        }

        // Вычисляем значение производной
        const yDerivative = math.evaluate(derivativeResult.simplified || derivativeResult.derivative, { [data.variable]: x });
        if (typeof yDerivative === 'number' && isFinite(yDerivative)) {
          derivativeData.push({ x, y: yDerivative });
        }
      } catch {
        // Пропускаем точки с ошибками вычисления
      }
    }

    return {
      ...derivativeResult,
      graphData: {
        original: originalData,
        derivative: derivativeData,
        xMin,
        xMax,
      },
    };
  }

  // Метод для вычисления значения производной в точке
  calculateDerivativeAtPoint(data: DerivativeAtPointDto): DerivativeAtPointResult {
    const { expression, variable, point, order = 1 } = data;
    
    try {
      // Преобразуем выражение
      const processedExpression = this.normalizeExpression(expression)
        .replace(/ln\(/g, 'log(')
        .replace(/tg\(/g, 'tan(')
        .replace(/ctg\(/g, 'cot(')
        .replace(/arctg\(/g, 'atan(')
        .replace(/arcsin\(/g, 'asin(')
        .replace(/arccos\(/g, 'acos(');
      
      const node = math.parse(processedExpression);
      let derivativeNode = node;
      
      // Вычисляем производную нужного порядка
      for (let i = 0; i < order; i++) {
        derivativeNode = math.derivative(derivativeNode, variable);
      }
      
      const derivativeStr = derivativeNode.toString();
      const simplifiedStr = math.simplify(derivativeNode).toString();
      
      // Вычисляем значения в точке
      const functionValue = math.evaluate(processedExpression, { [variable]: point });
      const derivativeValue = math.evaluate(simplifiedStr, { [variable]: point });
      
      // Уравнение касательной: y = f'(a)(x - a) + f(a)
      const tangentLine = `${derivativeValue} * (x - ${point}) + ${functionValue}`;
      
      return {
        original: expression,
        derivative: simplifiedStr,
        point,
        value: derivativeValue,
        functionValue,
        tangentLine: math.simplify(tangentLine).toString(),
      };
    } catch (error) {
      throw new Error(`Ошибка вычисления производной в точке: ${error.message}`);
    }
  }

  // Получить детальные шаги решения
  private getDetailedDerivativeSteps(node: math.MathNode, variable: string, orderNum: number): DerivativeStep[] {
    const steps: DerivativeStep[] = [];
    let stepNumber = 1;

    // Начальное выражение
    steps.push({
      step: stepNumber++,
      rule: orderNum > 1 ? `Производная ${orderNum}-го порядка` : 'Шаг 1: Исходная функция',
      expression: node.toString(),
      explanation: orderNum > 1 
        ? `Мы уже вычислили производную ${orderNum - 1}-го порядка. Теперь дифференцируем ещё раз по переменной ${variable}.`
        : `Дана функция f(${variable}) = ${node.toString()}. Найдём её производную по переменной ${variable}.`,
    });

    // Анализируем структуру выражения для детальных шагов
    const detailedSteps = this.analyzeExpressionStructure(node, variable);
    detailedSteps.forEach(s => {
      steps.push({
        step: stepNumber++,
        ...s,
      });
    });

    return steps;
  }

  // Анализ структуры выражения для генерации детальных шагов
  private analyzeExpressionStructure(node: math.MathNode, variable: string): Array<{rule: string; expression: string; explanation: string}> {
    const steps: Array<{rule: string; expression: string; explanation: string}> = [];
    const type = node.type;

    if (type === 'OperatorNode') {
      const opNode = node as any;
      const op = opNode.op;
      const fn = opNode.fn;
      const args = opNode.args;

      // Обработка унарного минуса
      if (fn === 'unaryMinus') {
        steps.push({
          rule: 'Производная функции с константным множителем',
          expression: node.toString(),
          explanation: `Производная выражения -f(${variable}) равна -f'(${variable}). Константный множитель (-1) выносится за знак производной: (-f)' = -f'. Дифференцируем ${args[0]?.toString()} и добавляем знак минус.`,
        });
        
        if (this.containsVariable(args[0], variable)) {
          steps.push({
            rule: 'Дифференцирование внутренней функции',
            expression: args[0]?.toString(),
            explanation: `Находим производную функции ${args[0]?.toString()}, затем умножаем на -1.`,
          });
        }
      } else if (fn === 'unaryPlus') {
        // Унарный плюс не меняет выражение, просто дифференцируем аргумент
        steps.push({
          rule: 'Унарный плюс',
          expression: node.toString(),
          explanation: `Унарный плюс не влияет на значение функции, поэтому (+f)' = f'. Дифференцируем ${args[0]?.toString()} без изменений.`,
        });
      } else if (op === '+' || op === '-') {
        steps.push({
          rule: 'Правило суммы и разности',
          expression: node.toString(),
          explanation: `Производная суммы (или разности) функций равна сумме (или разности) их производных: (f ${op} g)' = f' ${op} g'. Вычислим производную каждого слагаемого отдельно.`,
        });
        
        args.forEach((arg: math.MathNode, idx: number) => {
          if (this.containsVariable(arg, variable)) {
            steps.push({
              rule: `Слагаемое ${idx + 1}`,
              expression: arg.toString(),
              explanation: `Дифференцируем слагаемое: ${arg.toString()}`,
            });
          }
        });
      } else if (op === '*') {
        const hasConstant = args.some((arg: math.MathNode) => !this.containsVariable(arg, variable));
        
        if (hasConstant && args.length === 2) {
          const constantArg = args.find((arg: math.MathNode) => !this.containsVariable(arg, variable));
          const variableArg = args.find((arg: math.MathNode) => this.containsVariable(arg, variable));
          
          steps.push({
            rule: 'Вынесение константы',
            expression: node.toString(),
            explanation: `Константный множитель ${constantArg?.toString()} можно вынести за знак производной: (C·f)' = C·f'. Дифференцируем только ${variableArg?.toString()}.`,
          });
        } else {
          steps.push({
            rule: 'Правило произведения (формула Лейбница)',
            expression: node.toString(),
            explanation: `Производная произведения двух функций: (u·v)' = u'·v + u·v'. Здесь u = ${args[0]?.toString()}, v = ${args[1]?.toString()}. Найдём u' и v', затем применим формулу.`,
          });
          
          steps.push({
            rule: 'Производная u',
            expression: args[0]?.toString(),
            explanation: `Находим производную первого сомножителя u = ${args[0]?.toString()}`,
          });
          
          steps.push({
            rule: 'Производная v',
            expression: args[1]?.toString(),
            explanation: `Находим производную второго сомножителя v = ${args[1]?.toString()}`,
          });
        }
      } else if (op === '/') {
        steps.push({
          rule: 'Правило частного (дробь)',
          expression: node.toString(),
          explanation: `Производная частного: (u/v)' = (u'·v - u·v') / v². Числитель: u = ${args[0]?.toString()}, знаменатель: v = ${args[1]?.toString()}. Дифференцируем числитель и знаменатель отдельно.`,
        });
        
        steps.push({
          rule: 'Производная числителя',
          expression: args[0]?.toString(),
          explanation: `Находим производную числителя: (${args[0]?.toString()})'`,
        });
        
        steps.push({
          rule: 'Производная знаменателя',
          expression: args[1]?.toString(),
          explanation: `Находим производную знаменателя: (${args[1]?.toString()})'`,
        });
        
        steps.push({
          rule: 'Применение формулы',
          expression: node.toString(),
          explanation: `Подставляем найденные производные в формулу (u'·v - u·v') / v² и упрощаем.`,
        });
      } else if (op === '^') {
        const base = args[0];
        const exponent = args[1];
        
        if (!this.containsVariable(exponent, variable)) {
          steps.push({
            rule: 'Степенная функция',
            expression: node.toString(),
            explanation: `Производная степенной функции с постоянным показателем: (x^n)' = n·x^(n-1). В данном случае n = ${exponent?.toString()}.`,
          });
          
          steps.push({
            rule: 'Применение формулы',
            expression: node.toString(),
            explanation: `(${base?.toString()})^${exponent?.toString()}' = ${exponent?.toString()}·(${base?.toString()})^(${exponent?.toString()}-1)`,
          });
        } else {
          steps.push({
            rule: 'Показательная функция с переменным показателем',
            expression: node.toString(),
            explanation: `Когда и основание, и показатель зависят от ${variable}, используем логарифмическое дифференцирование: d/dx(u^v) = u^v·(v'·ln(u) + v·u'/u)`,
          });
        }
      }
    } else if (type === 'FunctionNode') {
      const funcNode = node as any;
      const funcName = funcNode.fn.name;
      const arg = funcNode.args[0];
      const argStr = arg?.toString();
      
      if (funcName === 'sin') {
        steps.push({
          rule: 'Производная синуса',
          expression: node.toString(),
          explanation: `Производная синуса: (sin(u))' = cos(u)·u'. В данном случае u = ${argStr}.`,
        });
        
        if (argStr !== variable) {
          steps.push({
            rule: 'Правило цепочки (композиция)',
            expression: argStr,
            explanation: `Так как аргумент синуса не просто ${variable}, а ${argStr}, применяем правило цепочки: дифференцируем внешнюю функцию (sin), затем умножаем на производную внутренней функции (${argStr})'.`,
          });
        }
      } else if (funcName === 'cos') {
        steps.push({
          rule: 'Производная косинуса',
          expression: node.toString(),
          explanation: `Производная косинуса: (cos(u))' = -sin(u)·u'. Важно не забыть знак минус! u = ${argStr}.`,
        });
        
        if (argStr !== variable) {
          steps.push({
            rule: 'Правило цепочки',
            expression: argStr,
            explanation: `Применяем цепное правило: умножаем -sin(${argStr}) на производную аргумента (${argStr})'.`,
          });
        }
      } else if (funcName === 'tan' || funcName === 'tg') {
        steps.push({
          rule: 'Производная тангенса',
          expression: node.toString(),
          explanation: `Производная тангенса: (tg(u))' = u'/cos²(u) = u'·(1 + tg²(u)). u = ${argStr}.`,
        });
      } else if (funcName === 'exp') {
        steps.push({
          rule: 'Производная экспоненты',
          expression: node.toString(),
          explanation: `Замечательное свойство экспоненты: (e^u)' = e^u·u'. Функция остаётся той же! u = ${argStr}.`,
        });
        
        if (argStr !== variable) {
          steps.push({
            rule: 'Правило цепочки',
            expression: argStr,
            explanation: `Дифференцируем показатель степени: (${argStr})' и умножаем на e^(${argStr}).`,
          });
        }
      } else if (funcName === 'log' || funcName === 'ln') {
        steps.push({
          rule: 'Производная натурального логарифма',
          expression: node.toString(),
          explanation: `Производная ln(u): (ln(u))' = u'/u. Производная аргумента делится на сам аргумент. u = ${argStr}.`,
        });
        
        if (argStr !== variable) {
          steps.push({
            rule: 'Правило цепочки',
            expression: argStr,
            explanation: `Вычисляем (${argStr})' и делим на ${argStr}.`,
          });
        }
      } else if (funcName === 'sqrt') {
        steps.push({
          rule: 'Производная квадратного корня',
          expression: node.toString(),
          explanation: `Производная корня: (√u)' = u'/(2√u). Можно также записать как (u^(1/2))' = (1/2)·u^(-1/2)·u'. u = ${argStr}.`,
        });
        
        if (argStr !== variable) {
          steps.push({
            rule: 'Правило цепочки',
            expression: argStr,
            explanation: `Дифференцируем подкоренное выражение: (${argStr})' и делим на 2√(${argStr}).`,
          });
        }
      } else if (funcName === 'abs') {
        steps.push({
          rule: 'Производная модуля',
          expression: node.toString(),
          explanation: `Производная модуля: (|u|)' = u'·u/|u| = u'·sign(u). Внимание: в точке u=0 производная не существует! u = ${argStr}.`,
        });
      }
    } else if (type === 'SymbolNode') {
      const symbolNode = node as any;
      if (symbolNode.name === variable) {
        steps.push({
          rule: 'Производная независимой переменной',
          expression: variable,
          explanation: `Производная переменной по самой себе всегда равна 1: d${variable}/d${variable} = 1. Это базовое правило дифференцирования.`,
        });
      } else {
        steps.push({
          rule: 'Производная константы',
          expression: symbolNode.name,
          explanation: `${symbolNode.name} — это константа (не зависит от ${variable}), поэтому её производная равна 0. Константы "исчезают" при дифференцировании.`,
        });
      }
    } else if (type === 'ConstantNode') {
      steps.push({
        rule: 'Производная числовой константы',
        expression: node.toString(),
        explanation: `Производная любого числа равна 0, так как константа не изменяется: d(C)/d${variable} = 0.`,
      });
    }

    return steps;
  }

  // Проверка, содержит ли узел переменную
  private containsVariable(node: math.MathNode, variable: string): boolean {
    const nodeStr = node.toString();
    return nodeStr.includes(variable);
  }

  // Анализ узла для генерации шагов
  private analyzeNodeForSteps(node: math.MathNode, variable: string, steps: DerivativeStep[], stepNumber: number): void {
    const type = node.type;
    const nodeStr = node.toString();

    if (type === 'OperatorNode') {
      const opNode = node as any;
      const op = opNode.op;
      
      if (op === '+' || op === '-') {
        steps.push({
          step: stepNumber++,
          rule: 'Правило суммы/разности',
          expression: nodeStr,
          explanation: `Производная суммы/разности равна сумме/разности производных: (f ± g)' = f' ± g'`,
        });
      } else if (op === '*') {
        steps.push({
          step: stepNumber++,
          rule: 'Правило произведения',
          expression: nodeStr,
          explanation: `Применяем правило произведения: (f·g)' = f'·g + f·g'`,
        });
      } else if (op === '/') {
        steps.push({
          step: stepNumber++,
          rule: 'Правило частного',
          expression: nodeStr,
          explanation: `Применяем правило частного: (f/g)' = (f'·g - f·g') / g²`,
        });
      } else if (op === '^') {
        steps.push({
          step: stepNumber++,
          rule: 'Правило степенной функции',
          expression: nodeStr,
          explanation: `Применяем правило: (xⁿ)' = n·xⁿ⁻¹`,
        });
      }
    } else if (type === 'FunctionNode') {
      const funcNode = node as any;
      const funcName = funcNode.fn.name;
      
      if (funcName === 'sin') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная синуса',
          expression: nodeStr,
          explanation: `(sin(u))' = cos(u)·u'`,
        });
      } else if (funcName === 'cos') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная косинуса',
          expression: nodeStr,
          explanation: `(cos(u))' = -sin(u)·u'`,
        });
      } else if (funcName === 'tan' || funcName === 'tg') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная тангенса',
          expression: nodeStr,
          explanation: `(tg(u))' = u' / cos²(u)`,
        });
      } else if (funcName === 'exp') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная экспоненты',
          expression: nodeStr,
          explanation: `(eᵘ)' = eᵘ·u'`,
        });
      } else if (funcName === 'log' || funcName === 'ln') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная логарифма',
          expression: nodeStr,
          explanation: `(ln(u))' = u' / u`,
        });
      } else if (funcName === 'sqrt') {
        steps.push({
          step: stepNumber++,
          rule: 'Производная корня',
          expression: nodeStr,
          explanation: `(√u)' = u' / (2√u)`,
        });
      }
    } else if (type === 'SymbolNode') {
      const symbolNode = node as any;
      if (symbolNode.name === variable) {
        steps.push({
          step: stepNumber++,
          rule: 'Производная переменной',
          expression: variable,
          explanation: `(${variable})' = 1`,
        });
      } else {
        steps.push({
          step: stepNumber++,
          rule: 'Производная константы',
          expression: nodeStr,
          explanation: `(C)' = 0`,
        });
      }
    } else if (type === 'ConstantNode') {
      steps.push({
        step: stepNumber++,
        rule: 'Производная константы',
        expression: nodeStr,
        explanation: `(C)' = 0`,
      });
    }
  }

  // Старый метод для обратной совместимости
  calculateDerivative(data: CalculusDto): CalculusResult {
    const { expression, variable } = data;
    
    try {
      const derivativeResult = this.calculateDerivativeDetailed({
        expression,
        variable,
        order: 1,
        simplify: true,
      });

      return {
        result: derivativeResult.simplified || derivativeResult.derivative,
        steps: derivativeResult.steps.map(s => `${s.rule}: ${s.explanation}`),
        latex: this.toLatex(derivativeResult.simplified || derivativeResult.derivative),
      };
    } catch (error) {
      throw new Error(`Ошибка вычисления производной: ${error.message}`);
    }
  }

  calculateIntegral(data: CalculusDto): CalculusResult {
    const { expression, variable, bounds } = data;
    const normalizedExpr = this.normalizeExpression(expression);
    
    try {
      let integral: string;
      let steps: string[];
      let stepsStructured: IntegralStepStructured[] | undefined;

      // Сначала пробуем правило-движок (для подробных пошаговых решений в стиле MathDF)
      if (bounds) {
        // Определённый интеграл: Ньютон—Лейбниц → Nerdamer defint (несколько стратегий) → численно Симпсон
        const nl = this.tryNewtonLeibnizDefinite(normalizedExpr, variable, bounds);
        if (nl !== null) {
          integral = this.formatDefiniteNumericResult(nl.value);
          steps = this.getDefiniteIntegralStepsNewtonLeibniz(
            normalizedExpr,
            variable,
            bounds,
            nl.indefinite,
            nl.value
          );
          stepsStructured = this.getDefiniteIntegralStructuredNewtonLeibniz(
            normalizedExpr,
            variable,
            bounds,
            nl.indefinite,
            nl.value
          );
        } else {
          // ∫(многочлен)/(линейный) — сначала точная первообразная, затем F(b)−F(a)
          const cleanQL = normalizedExpr.replace(/\s/g, '').replace(/ln\(/g, 'log(');
          const manualQuadLin = this.tryIntegralPolynomialOverLinear(cleanQL, variable);
          const polyNl =
            manualQuadLin !== null
              ? this.tryNewtonLeibnizFromIndefinite(manualQuadLin, variable, bounds)
              : null;

          if (polyNl !== null) {
            integral = this.formatDefiniteNumericResult(polyNl.value);
            steps = this.getDefiniteIntegralStepsNewtonLeibniz(
              normalizedExpr,
              variable,
              bounds,
              polyNl.indefinite,
              polyNl.value
            );
            stepsStructured = this.getDefiniteIntegralStructuredNewtonLeibniz(
              normalizedExpr,
              variable,
              bounds,
              polyNl.indefinite,
              polyNl.value
            );
          } else {
          const nerdamerResult = this.tryNerdamerIntegral(normalizedExpr, variable, bounds);
          if (nerdamerResult) {
            integral = nerdamerResult.integral;
            steps = nerdamerResult.steps;
            stepsStructured = nerdamerResult.stepsStructured;
          } else {
            const num = this.numericalDefiniteIntegralSimpson(normalizedExpr, variable, bounds);
            if (num !== null && Number.isFinite(num)) {
              integral = this.formatDefiniteNumericResult(num);
              steps = this.getDefiniteIntegralStepsNumerical(normalizedExpr, variable, bounds, num);
              stepsStructured = this.getDefiniteIntegralStructuredNumerical(normalizedExpr, variable, bounds, num);
            } else {
              integral =
                'Не удалось вычислить определённый интеграл: символьные методы недоступны, численная оценка не сошлась (особенности функции на отрезке).';
              steps = this.getDefiniteIntegralFailureSteps(normalizedExpr, variable, bounds);
              stepsStructured = this.getDefiniteIntegralStructuredFailure(normalizedExpr, variable, bounds);
            }
          }
          }
        }
      } else {
        integral = this.simplifyIntegral(normalizedExpr, variable);
        steps = this.getIntegralSteps(normalizedExpr, variable);
        stepsStructured = this.getIntegralStepsStructured(normalizedExpr, variable, integral);
      }

      // Fallback на nerdamer, если правило-движок вернул fallback (∫...dx + C)
      const isFallback = !bounds && integral.startsWith('∫(');
      if (isFallback) {
        const nerdamerResult = this.tryNerdamerIntegral(normalizedExpr, variable, bounds);
        if (nerdamerResult) {
          integral = nerdamerResult.integral;
          steps = nerdamerResult.steps;
          stepsStructured = nerdamerResult.stepsStructured;
        }
      }

      // ∫(многочлен ≤2)/(линейный): точное деление в mathjs; nerdamer для таких дробей даёт неверный ответ
      if (!bounds) {
        const cleanQL = normalizedExpr.replace(/\s/g, '').replace(/ln\(/g, 'log(');
        const manualQuadLin = this.tryIntegralPolynomialOverLinear(cleanQL, variable);
        if (manualQuadLin) {
          integral = manualQuadLin;
          steps = this.getIntegralSteps(normalizedExpr, variable);
          stepsStructured = this.getIntegralStepsStructured(normalizedExpr, variable, integral);
        }
      }

      // После CAS: если ответ по-прежнему «тот же интеграл» — не элементарно в нашем движке (не путать с ошибкой)
      if (!bounds && this.isUnevaluatedIntegralPlaceholder(integral, normalizedExpr, variable)) {
        const msg =
          'Не удалось выразить первообразную через элементарные функции (полиномы, exp, ln, sin/cos, …). ' +
          'Интегралы с произведением x^k·e^x·ln(x) часто не сводятся к «школьным» функциям — нужны специальные функции (например Ei(x)) или численное интегрирование. Это ограничение символьного CAS, а не ошибка счёта.';
        integral = msg;
        steps = this.getUnintegratedIntegralSteps(normalizedExpr, variable);
        stepsStructured = this.getUnintegratedIntegralStepsStructured(normalizedExpr, variable);
        this.integralResult = { result: msg, method: 'unintegrated' };
      }

      const latex =
        !bounds && this.integralResult.method === 'unintegrated'
          ? `\\int \\left(${this.toLatex(normalizedExpr)}\\right) \\, d${variable} \\quad \\text{(не элементарно)}`
          : this.toLatex(integral);

      return {
        result: integral,
        steps,
        latex,
        ...(stepsStructured && stepsStructured.length > 0 ? { stepsStructured } : {}),
      };
    } catch (error) {
      throw new Error(`Ошибка вычисления интеграла: ${error.message}`);
    }
  }

  /** Преобразует выражение в формат nerdamer (ln→log, tg→tan, exp(x)→e^x) */
  private toNerdamerExpr(expr: string): string {
    return expr
      .replace(/\s/g, '')
      .replace(/ln\(/g, 'log(')
      .replace(/tg\(/g, 'tan(')
      .replace(/ctg\(/g, 'cot(')
      .replace(/arctg\(/g, 'atan(')
      .replace(/arcsin\(/g, 'asin(')
      .replace(/arccos\(/g, 'acos(')
      .replace(/arcctg\(/g, 'acot(')
      .replace(/exp\(([^)]+)\)/g, 'e^($1)');
  }

  /** Преобразует результат nerdamer в наш формат (e^→exp, atan→arctan) */
  private fromNerdamerResult(s: string): string {
    let r = s
      .replace(/e\^\(([^)]+)\)/g, 'exp($1)')
      .replace(/\be\^([a-zA-Z])/g, 'exp($1)')
      .replace(/\batan\(/g, 'arctan(')
      .replace(/\basin\(/g, 'arcsin(')
      .replace(/\bacos\(/g, 'arccos(')
      .replace(/\bacot\(/g, 'arcctg(');
    return r;
  }

  /** true, если строка — заглушка вида ∫(expr)dvar + C без реального интегрирования */
  private isUnevaluatedIntegralPlaceholder(integral: string, expr: string, variable: string): boolean {
    const i = integral.replace(/\s/g, '');
    const e = expr.replace(/\s/g, '');
    const v = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^∫\\((.+)\\)d${v}\\+C$`);
    const m = i.match(re);
    if (!m) return false;
    return m[1] === e;
  }

  private getUnintegratedIntegralSteps(expression: string, variable: string): string[] {
    return [
      `Шаг 1. Записываем интеграл: ∫(${expression}) d${variable}`,
      `Шаг 2. Символьный движок (mathjs + Nerdamer) не нашёл первообразную в виде элементарных функций (или ответ не прошёл проверку d/dx).`,
      `Шаг 3. Для выражений вроде x^2·e^x·ln(x) замкнутая форма часто включает специальные функции (например Ei(x)) либо используется численное интегрирование.`,
      `Вывод: это ограничение класса функций калькулятора, а не ошибка «неправильного счёта».`,
    ];
  }

  private getUnintegratedIntegralStepsStructured(expression: string, variable: string): IntegralStepStructured[] {
    return [
      {
        actionLabel: 'Записываем',
        expression: `∫ (${expression}) d${variable}`,
      },
      {
        actionLabel: 'Пояснение',
        rule: {
          name: 'Почему нет ответа в «школьных» функциях',
          formula:
            'Не всякий ∫f(x)dx выражается через полиномы, exp, ln и sin/cos; произведение степени x, e^x и ln x обычно ведёт к спецфункциям или численным методам.',
        },
      },
    ];
  }

  /** Пробует вычислить интеграл через nerdamer (как MathDF). Возвращает null при неудаче. */
  private tryNerdamerIntegral(
    expression: string,
    variable: string,
    bounds?: { lower: number; upper: number }
  ): { integral: string; steps: string[]; stepsStructured: IntegralStepStructured[] } | null {
    try {
      const nerdamerExpr = this.toNerdamerExpr(expression);
      let result: any;

      if (bounds !== undefined) {
        const { lower, upper } = bounds;
        const defStrategies = [
          `defint(${nerdamerExpr}, ${lower}, ${upper}, ${variable})`,
          `defint(expand(${nerdamerExpr}), ${lower}, ${upper}, ${variable})`,
          `defint(factor(${nerdamerExpr}), ${lower}, ${upper}, ${variable})`,
        ];
        result = null;
        for (const cmd of defStrategies) {
          try {
            const r = nerdamer(cmd);
            const hasIntegral =
              r.hasIntegral && typeof r.hasIntegral === 'function' && r.hasIntegral();
            if (hasIntegral) continue;
            const rs = r.toString();
            if (!rs || rs.includes('integrate(') || rs.includes('defint(')) continue;
            result = r;
            break;
          } catch {
            continue;
          }
        }
        if (!result) return null;
      } else {
        const strategies = [
          `integrate(${nerdamerExpr}, ${variable})`,
          `integrate(expand(${nerdamerExpr}), ${variable})`,
          `integrate(factor(${nerdamerExpr}), ${variable})`,
        ];
        result = null;
        for (const cmd of strategies) {
          try {
            const r = nerdamer(cmd);
            const hasIntegral =
              r.hasIntegral && typeof r.hasIntegral === 'function' && r.hasIntegral();
            if (hasIntegral) continue;
            const rs = r.toString();
            if (!rs || rs.includes('integrate(')) continue;
            if (IntegralCalculatorEngine.verifyIndefiniteAntiderivative(nerdamerExpr, variable, rs)) {
              result = r;
              break;
            }
          } catch {
            continue;
          }
        }
        if (!result) return null;
      }

      const hasIntegral = result.hasIntegral && typeof result.hasIntegral === 'function' && result.hasIntegral();
      if (hasIntegral) return null; // не полностью проинтегрировано

      let resultStr = result.toString();
      if (!resultStr || resultStr.includes('integrate(')) return null;

      if (bounds) {
        // определённый интеграл — без проверки производной
      } else {
        const ok = IntegralCalculatorEngine.verifyIndefiniteAntiderivative(nerdamerExpr, variable, resultStr);
        if (!ok) return null;
      }

      const integral = bounds
        ? this.fromNerdamerResult(resultStr)
        : this.fromNerdamerResult(resultStr) + ' + C';

      const steps = this.getNerdamerIntegralSteps(expression, variable, integral, !!bounds, bounds);
      const stepsStructured = this.getNerdamerIntegralStepsStructured(expression, variable, integral, !!bounds, bounds);
      return { integral, steps, stepsStructured };
    } catch {
      return null;
    }
  }

  /** Пошаговое решение для nerdamer в макете MathDF */
  private getNerdamerIntegralStepsStructured(
    expression: string,
    variable: string,
    result: string,
    isDefinite: boolean,
    bounds?: { lower: number; upper: number }
  ): IntegralStepStructured[] {
    const steps: IntegralStepStructured[] = [];
    steps.push({
      actionLabel: 'Вычислим',
      expression: isDefinite && bounds
        ? `∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`
        : `∫ (${expression}) d${variable}`,
    });
    steps.push({
      actionLabel: isDefinite && bounds ? 'Символьный defint' : 'Применяем символьное интегрирование',
      rule: {
        name:
          isDefinite && bounds
            ? 'Определённый интеграл (Nerdamer defint)'
            : 'Методы: замена переменной, по частям, рациональные дроби, табличные интегралы',
        formula:
          isDefinite && bounds
            ? '\\int_a^b f(x)\\,dx'
            : 'Автоматический поиск первообразной (аналог MathDF)',
      },
      expressionAfter: isDefinite && bounds ? `= ${result}` : result,
    });
    return steps;
  }

  /** Генерирует пошаговое решение в стиле MathDF (с блоками правил, формулами, подстановками) */
  private getIntegralStepsStructured(expression: string, variable: string, result: string): IntegralStepStructured[] {
    const method = this.integralResult.method;
    const steps: IntegralStepStructured[] = [];

    if (method === 'by_parts' && this.integralResult.byParts) {
      const bp = this.integralResult.byParts;
      const v = variable;

      // ∫ x² ln(x) dx — как на MathDF
      if (bp.u === `log(${v})` && (bp.dv === `${v}^2 d${v}` || bp.dv?.startsWith(`${v}^2 d`))) {
        steps.push({
          actionLabel: 'Вычислим',
          expression: `∫ ${v}^2*ln(${v}) d${v}`,
          rule: {
            name: 'Интегрирование по частям',
            formula: '∫ u·dv = u·v − ∫ v·du',
            substitutions: [
              { symbol: 'u', value: `ln(${v})` },
              { symbol: 'dv', value: `${v}^2 d${v}` },
              { symbol: 'du', value: `1/${v} d${v}` },
              { symbol: 'v', value: `${v}^3/3` },
            ],
          },
          expressionAfter: `${v}^3/3*ln(${v}) − ∫ (${v}^3/3)/${v} d${v} = ${v}^3/3*ln(${v}) − ∫ ${v}^2/3 d${v}`,
        });
        steps.push({
          actionLabel: 'Упростите',
          expression: `∫ ${v}^2/3 d${v}`,
        });
        steps.push({
          actionLabel: 'Вычислим',
          rule: {
            name: 'Интеграл от степенной функции',
            formula: '∫ x^n dx = x^(n+1)/(n+1)',
            substitutions: [{ symbol: 'n', value: '2' }],
          },
          expression: `${v}^3/9`,
        });
        steps.push({
          actionLabel: 'Интеграл окончен',
          expression: result,
        });
        return steps;
      }

      // ∫ x² e^x dx — полная иерархия как на MathDF: подзадачи (1), (2), табличный ∫e^x
      if (this.isByPartsXSquaredExp(bp, v)) {
        steps.push({
          actionLabel: 'Вычисляем',
          expression: `∫ ${v}^2·e^${v} d${v}`,
          rule: {
            name: 'Интегрирование по частям',
            formula: '∫ u·dv = u·v − ∫ v·du',
            substitutions: [
              { symbol: 'u', value: `${v}^2` },
              { symbol: 'dv', value: `e^${v} d${v}` },
              { symbol: 'du', value: `2·${v} d${v}` },
              { symbol: 'v', value: `∫ e^${v} d${v} = e^${v}` },
            ],
          },
          expressionAfter: `${v}^2·e^${v} − ∫ 2·${v}·e^${v} d${v} = ${v}^2·e^${v} − (1)`,
          subSteps: [
            {
              actionLabel: 'Упростите',
              expression: `∫ 2·${v}·e^${v} d${v} = 2·∫ ${v}·e^${v} d${v}`,
            },
            {
              actionLabel: 'Вычисляем',
              expression: `∫ ${v}·e^${v} d${v}  (1)`,
              rule: {
                name: 'Интегрирование по частям',
                formula: '∫ u·dv = u·v − ∫ v·du',
                substitutions: [
                  { symbol: 'u', value: `${v}` },
                  { symbol: 'dv', value: `e^${v} d${v}` },
                  { symbol: 'du', value: `d${v}` },
                  { symbol: 'v', value: `∫ e^${v} d${v} = e^${v}` },
                ],
              },
              expressionAfter: `${v}·e^${v} − ∫ e^${v} d${v} = ${v}·e^${v} − (2)`,
              subSteps: [
                {
                  actionLabel: 'Вычисляем',
                  expression: `∫ e^${v} d${v}  (2)`,
                  rule: {
                    name: 'Табличный интеграл',
                    formula: `∫ e^${v} d${v} = e^${v}`,
                  },
                  expressionAfter: `e^${v}`,
                },
              ],
            },
            {
              actionLabel: 'Подставим',
              expression: `(1): ∫ ${v}·e^${v} d${v} = ${v}·e^${v} − e^${v} = (${v} − 1)·e^${v}`,
            },
            {
              actionLabel: 'Подставим',
              expression: `2·∫ ${v}·e^${v} d${v} = 2·(${v} − 1)·e^${v} = 2·${v}·e^${v} − 2·e^${v}`,
            },
            {
              actionLabel: 'Соберём ответ',
              expression: `${v}^2·e^${v} − (2·${v}·e^${v} − 2·e^${v}) = (${v}^2 − 2·${v} + 2)·e^${v}`,
            },
          ],
        });
        steps.push({
          actionLabel: 'Интеграл окончен',
          expression: result,
        });
        return steps;
      }

      // ∫(ax²+b)*log(x)dx — полная иерархия как на MathDF
      const ax2bMatch = this.integralResult.byParts.dv?.match(new RegExp(`\\((\\d+)\\*?${v}\\^2\\+(\\d+)\\)`));
      if (ax2bMatch) {
        const a = parseInt(ax2bMatch[1], 10);
        const b = parseInt(ax2bMatch[2], 10);
        const gExpr = `2(2*${v}^3/3+${v})`; // g = 2(2x³/3+x)
        const fExpr = `ln(${v})`;
        const fpExpr = `1/${v}`;
        const gpExpr = `${a}*${v}^2+${b}`;

        steps.push({
          actionLabel: 'Вычислим',
          expression: `∫ (${a}*${v}^2+${b})*ln(${v}) d${v}`,
          rule: {
            name: 'Интегрирование по частям',
            formula: "∫ f·g' dx = f·g − ∫ f'·g dx",
            substitutions: [
              { symbol: 'f', value: fExpr },
              { symbol: "f'", value: fpExpr },
              { symbol: "g'", value: gpExpr },
              { symbol: 'g', value: gExpr },
            ],
          },
          expressionAfter: `${gExpr}*ln(${v}) − ∫ (${gExpr})/${v} d${v}`,
        });

        steps.push({
          actionLabel: 'Упростите',
          expression: `2*∫ (2*${v}^2/3+1) d${v}`,
        });

        steps.push({
          actionLabel: 'Разложить',
          expression: `2*∫ (2*${v}^2/3) d${v} + 2*∫ 1 d${v}`,
          subSteps: [
            {
              rule: {
                name: 'Интеграл от степенной функции',
                formula: '∫ x^n dx = x^(n+1)/(n+1)',
                substitutions: [{ symbol: 'n', value: '2' }],
              },
              expression: '4*x^3/9',
            },
            {
              rule: {
                name: 'Интеграл константы',
                formula: '∫ a dx = ax',
              },
              expression: '2*x',
            },
          ],
        });

        steps.push({
          actionLabel: 'Интеграл окончен',
          expression: result,
        });
      } else {
        // Общий случай интегрирования по частям
        steps.push({
          actionLabel: 'Вычислим:',
          rule: {
            name: 'Интегрирование по частям',
            formula: '∫ u·dv = u·v − ∫ v·du',
            substitutions: [
              { symbol: 'u', value: bp.u },
              { symbol: 'du', value: bp.du },
              { symbol: 'dv', value: bp.dv },
              { symbol: 'v', value: bp.v },
            ],
          },
          expression: bp.uv ? `${bp.uv} − ∫ ${bp.v}·(1/${variable}) d${variable}` : result,
        });
        if (bp.remainingIntegral) {
          steps.push({
            actionLabel: 'Вычислим оставшийся интеграл:',
            expression: bp.remainingIntegral,
          });
        }
        steps.push({
          actionLabel: 'Интеграл окончен',
          expression: result,
        });
      }
    } else if (method === 'substitution' && this.integralResult.rationalQuadraticOverLinear) {
      const rq = this.integralResult.rationalQuadraticOverLinear;
      const x = variable;
      const remPart =
        rq.remainderStr !== undefined && rq.remainderStr !== '0'
          ? `${rq.remainderStr}/(${rq.denomInnerStr})`
          : Math.abs(rq.remainder) > 1e-10
            ? `${this.formatShortCoeff(rq.remainder)}/(${rq.denomInnerStr})`
            : '';
      const hasRem = Boolean(remPart);
      const decomp = hasRem
        ? `(${rq.numerStr})/(${rq.denomStr}) = ${rq.quotientStr} + ${remPart}`
        : `(${rq.numerStr})/(${rq.denomStr}) = ${rq.quotientStr}`;
      steps.push({
        actionLabel: 'Вычисляем',
        expression: `∫ (${rq.numerStr})/(${rq.denomStr}) d${x}`,
        rule: {
          name: 'Рациональная дробь: деление многочлена на линейный множитель',
          formula: `(${rq.numerStr}) = (${rq.quotientStr})·(${rq.denomStr}) + R`,
          substitutions: [
            { symbol: 'Частное', value: rq.quotientStr },
            { symbol: 'Остаток R', value: rq.remainderStr ?? String(rq.remainder) },
          ],
        },
        expressionAfter: decomp,
      });
      steps.push({
        actionLabel: 'Разложим интеграл',
        expression: hasRem
          ? `∫ (${rq.quotientStr} + ${remPart}) d${x} = ∫ (${rq.quotientStr}) d${x} + ∫ (${remPart}) d${x}`
          : `∫ (${rq.quotientStr}) d${x}`,
      });
      const subSteps: IntegralStepStructured[] = [];
      if (rq.integratedQuotient) {
        subSteps.push({
          actionLabel: 'Частное Q(x)',
          rule: {
            name: 'Интегрирование многочлена',
            formula: '∫ Q(x) dx — по таблице степеней',
          },
          expression: `∫ (${rq.quotientStr}) d${x} = ${rq.integratedQuotient}`,
        });
      } else {
        if (Math.abs(rq.coeffA) > 1e-10) {
          subSteps.push({
            actionLabel: 'Степень 1',
            rule: {
              name: 'Табличный интеграл',
              formula: '∫ a·x dx = a·x²/2',
            },
            expression: `∫ ${this.formatShortCoeff(rq.coeffA)}*${x} d${x} = ${this.formatShortCoeff(rq.coeffA / 2)}*${x}^2`,
          });
        }
        if (Math.abs(rq.coeffB) > 1e-10) {
          subSteps.push({
            actionLabel: 'Константа',
            rule: { name: 'Табличный интеграл', formula: '∫ k dx = k·x' },
            expression: `∫ ${this.formatShortCoeff(rq.coeffB)} d${x} = ${this.formatShortCoeff(rq.coeffB)}*${x}`,
          });
        }
      }
      if (hasRem) {
        subSteps.push({
          actionLabel: 'Дробь с линейным знаменателем',
          rule: {
            name: 'Интеграл вида ∫ k/(p·x+q) dx',
            formula: `∫ k/(${rq.denomInnerStr}) d${x} = (k/p)·ln|${rq.denomInnerStr}|`,
            substitutions: [
              { symbol: 'k', value: rq.remainderStr ?? String(rq.remainder) },
              { symbol: 'p', value: String(rq.p) },
            ],
          },
          expression: `∫ ${rq.remainderStr ?? this.formatShortCoeff(rq.remainder)}/(${rq.denomInnerStr}) d${x} = ${this.formatShortCoeff(rq.remainder / rq.p)}·ln(abs(${rq.denomInnerStr}))`,
        });
      }
      if (subSteps.length > 0) {
        steps.push({
          actionLabel: 'Почленное интегрирование',
          expression: hasRem ? `∫ (${rq.quotientStr} + ${remPart}) d${x}` : `∫ (${rq.quotientStr}) d${x}`,
          subSteps,
        });
      }
      steps.push({
        actionLabel: 'Интеграл окончен',
        expression: result,
      });
      return steps;
    } else if (method === 'substitution' && this.integralResult.substitution) {
      const sub = this.integralResult.substitution;
      steps.push({
        actionLabel: 'Применяем подстановку:',
        rule: {
          name: 'Замена переменной',
          formula: sub.dxExpr || undefined,
          substitutions: [
            { symbol: 'u', value: sub.u },
            { symbol: 'du', value: sub.du },
          ],
        },
        expression: result,
      });
    } else if (method === 'table' && this.integralResult.tableRule) {
      steps.push({
        actionLabel: 'Применяем табличную формулу:',
        rule: { name: this.integralResult.tableRule },
        expression: result,
      });
    }

    return steps;
  }

  private getNerdamerIntegralSteps(
    expression: string,
    variable: string,
    result: string,
    isDefinite: boolean,
    bounds?: { lower: number; upper: number }
  ): string[] {
    const steps: string[] = [];
    if (isDefinite && bounds) {
      steps.push(
        `Шаг 1. Записываем определённый интеграл: ∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`
      );
      steps.push(
        `Шаг 2. Символьное вычисление через Nerdamer (defint; при необходимости expand/factor подынтегрального выражения):`
      );
      steps.push(`Шаг 3. Значение интеграла: ${result}`);
    } else {
      steps.push(`Шаг 1. Записываем интеграл: ∫(${expression}) d${variable}`);
      steps.push(
        `Шаг 2. Применяем символьное интегрирование (методы: замена переменной, по частям, рациональные дроби, табличные интегралы):`
      );
      steps.push(`Шаг 3. Получаем:`);
      steps.push(`   ${result}`);
    }
    return steps;
  }

  private simplifyDerivative(expression: string, variable: string): string {
    // Упрощенная реализация для базовых функций
    const cleanExpr = expression.replace(/\s/g, '');
    
    // Производная от x^n
    const powerMatch = cleanExpr.match(new RegExp(`${variable}\\^(\\d+)`, 'g'));
    if (powerMatch) {
      for (const match of powerMatch) {
        const power = parseInt(match.split('^')[1]);
        const newPower = power - 1;
        const coefficient = power;
        
        if (newPower === 0) {
          cleanExpr.replace(match, coefficient.toString());
        } else if (newPower === 1) {
          cleanExpr.replace(match, `${coefficient}*${variable}`);
        } else {
          cleanExpr.replace(match, `${coefficient}*${variable}^${newPower}`);
        }
      }
    }
    
    // Производная от константы * x
    const linearMatch = cleanExpr.match(new RegExp(`(\\d+)\\*?${variable}`, 'g'));
    if (linearMatch) {
      for (const match of linearMatch) {
        const coefficient = match.replace(`*${variable}`, '').replace(variable, '1');
        cleanExpr.replace(match, coefficient);
      }
    }
    
    // Производная от константы = 0
    const constantMatch = cleanExpr.match(/\d+/g);
    if (constantMatch && !cleanExpr.includes(variable)) {
      return '0';
    }
    
    return cleanExpr || '0';
  }

  /** Результат интегрирования с метаданными для пошагового решения */
  private integralResult: {
    result: string;
    method: 'table' | 'substitution' | 'by_parts' | 'unintegrated';
    substitution?: { u: string; du: string; dxExpr?: string; integrandU?: string; antiderivU?: string };
    byParts?: { u: string; dv: string; du: string; v: string; uv?: string; remainingIntegral?: string };
    tableRule?: string; // конкретная формула из таблицы
    /** ∫(многочлен)/(линейный) — деление и ln (любая степень числителя) */
    rationalQuadraticOverLinear?: {
      numerStr: string;
      denomStr: string;
      quotientStr: string;
      remainder: number;
      remainderStr?: string;
      coeffA: number;
      coeffB: number;
      p: number;
      q: number;
      denomInnerStr: string;
      /** Антипроизводная частного ∫Q(x)dx (без +C), из Nerdamer */
      integratedQuotient?: string;
    };
  } = { result: '', method: 'table' };

  /** ∫ x²·e^x dx — распознавание для пошагового решения (MathDF) */
  private isByPartsXSquaredExp(
    bp: { u: string; dv?: string },
    variable: string
  ): boolean {
    const dvLooksExp =
      bp.dv?.includes(`exp(${variable})`) ||
      bp.dv?.includes(`e^${variable}`) ||
      /\bexp\s*\(/.test(bp.dv || '');
    return bp.u === `${variable}^2` && !!dvLooksExp;
  }

  /** Проверка: узел mathjs — ноль (после simplify) */
  private mathNodeIsZero(node: math.MathNode): boolean {
    try {
      const s = math.simplify(node).toString();
      return s === '0' || s === '-0';
    } catch {
      return false;
    }
  }

  /** Коэффициент для строки результата: 1/2, -3, 10 */
  private formatShortCoeff(r: number): string {
    if (Number.isInteger(r)) return String(r);
    try {
      const frac = math.fraction(r);
      const n = Number(frac.n);
      const d = Number(frac.d);
      if (d === 1) return String(n);
      if (n < 0) return `-(${Math.abs(n)}/${d})`;
      return `(${n}/${d})`;
    } catch {
      return String(r);
    }
  }

  /** Линейный знаменатель p·x+q в виде строки для log(abs(...)) */
  private buildLinearDenomInner(p: number, q: number, variable: string): string {
    try {
      const node = math.simplify(math.parse(`${p}*${variable}+(${q})`));
      return node.toString().replace(/\s/g, '');
    } catch {
      return `${p}*${variable}+${q}`;
    }
  }

  /** Разбор результата nerdamer div: "[Q, R]" */
  private parseNerdamerDivTuple(s: string): [string, string] | null {
    const t = s.trim();
    if (!t.startsWith('[') || !t.endsWith(']')) return null;
    const inner = t.slice(1, -1);
    const idx = inner.lastIndexOf(',');
    if (idx === -1) return null;
    const q = inner.slice(0, idx).trim();
    const r = inner.slice(idx + 1).trim();
    if (!q || r === undefined) return null;
    return [q, r];
  }

  /** Проверка: узел — многочлен по variable (производная степени+1 ≡ 0) */
  private isPolynomialInVariable(node: math.MathNode, variable: string, maxDeg = 40): boolean {
    let d: math.MathNode = node;
    for (let i = 0; i <= maxDeg + 1; i++) {
      if (this.mathNodeIsZero(d)) return true;
      d = math.derivative(d, variable);
    }
    return false;
  }

  /**
   * ∫(многочлен)/(линейный знаменатель) — деление Nerdamer (div), затем ∫ частного + ∫ остатка/знаменатель.
   * Покрывает любую степень числителя (не только квадратичный).
   */
  private tryIntegralPolynomialOverLinear(cleanExpr: string, variable: string): string | null {
    const m = cleanExpr.match(/^\(([^)]+)\)\/\(([^)]+)\)$/);
    if (!m) return null;
    const numStr = m[1];
    const denStr = m[2];
    try {
      const nNode = math.parse(numStr);
      const dNode = math.parse(denStr);
      const dLin = math.derivative(math.derivative(dNode, variable), variable);
      if (!this.mathNodeIsZero(dLin)) return null;
      const p = math.derivative(dNode, variable).evaluate({ [variable]: 0 }) as number;
      if (Math.abs(p) < 1e-12) return null;
      if (!this.isPolynomialInVariable(nNode, variable)) return null;

      const q = dNode.evaluate({ [variable]: 0 }) as number;
      const inner = this.buildLinearDenomInner(p, q, variable);

      const numN = this.toNerdamerExpr(numStr);
      const denN = this.toNerdamerExpr(denStr);
      const divStr = nerdamer(`div(${numN},${denN})`).toString();
      const parsed = this.parseNerdamerDivTuple(divStr);
      if (!parsed) return null;
      const [quotN, remN] = parsed;

      const intQ = nerdamer(`integrate((${quotN}), ${variable})`).toString();
      let intR = '0';
      if (remN !== '0') {
        intR = nerdamer(`integrate((${remN})/(${denN}), ${variable})`).toString();
      }
      const sum = nerdamer(`(${intQ})+(${intR})`).simplify().toString();
      const result = this.fromNerdamerResult(sum) + ' + C';

      const ok = IntegralCalculatorEngine.verifyIndefiniteAntiderivative(numN, variable, sum);
      if (!ok) return null;

      const quotientStr = quotN.replace(/\s/g, '');
      let remNum = 0;
      try {
        remNum = nerdamer(remN).evaluate() as number;
      } catch {
        remNum = parseFloat(remN) || 0;
      }

      let coeffA = 0;
      let coeffB = 0;
      const d3n = math.derivative(
        math.derivative(math.derivative(nNode, variable), variable),
        variable
      );
      if (this.mathNodeIsZero(d3n)) {
        const a =
          (math.derivative(math.derivative(nNode, variable), variable).evaluate({ [variable]: 0 }) as number) /
          2;
        const b = math.derivative(nNode, variable).evaluate({ [variable]: 0 }) as number;
        coeffA = a / p;
        coeffB = (b - coeffA * q) / p;
      }

      this.integralResult = {
        result,
        method: 'substitution',
        substitution: {
          u: `деление многочлена на линейный множитель (${denStr})`,
          du: `d${variable}`,
        },
        rationalQuadraticOverLinear: {
          numerStr: numStr,
          denomStr: denStr,
          quotientStr,
          remainder: remNum,
          remainderStr: remN,
          coeffA,
          coeffB,
          p,
          q,
          denomInnerStr: inner,
          integratedQuotient: this.fromNerdamerResult(intQ),
        },
      };
      return result;
    } catch {
      return null;
    }
  }

  private simplifyIntegral(expression: string, variable: string): string {
    const normalizedExpr = this.normalizeExpression(expression);
    let cleanExpr = normalizedExpr.replace(/\s/g, '').replace(/ln\(/g, 'log(');
    // exp((expr)) → exp(expr) при лишних скобках
    cleanExpr = cleanExpr.replace(/exp\(\(([^()]+)\)\)/g, (_, inner) => `exp(${inner})`);
    this.integralResult = { result: '', method: 'table' };
    
    try {
      // === (poly)/x через mathjs — разложение (4x²+2)/x = 4x + 2/x ===
      const rationalMatch = cleanExpr.match(new RegExp(`^\\(([^)]+)\\)\\/${variable}$`));
      if (rationalMatch) {
        try {
          const numStr = rationalMatch[1];
          const v = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const divNode = math.parse(`(${numStr})/${variable}`);
          const expanded = math.simplify(divNode);
          const expStr = expanded.toString().replace(/\s/g, '');
          const terms: string[] = [];
          const parts = expStr.split(/(?=[+-])/).filter((s: string) => s && s !== '+');
          for (const p of parts) {
            const trimmed = p.trim();
            // x^n (n > 0)
            const powMatch = trimmed.match(new RegExp(`^([+-]?)(\\d*)\\*?${v}\\^(-?\\d+)$`));
            // x без степени (линейный член)
            const linMatch = trimmed.match(new RegExp(`^([+-]?)(\\d*)\\*?${v}$`));
            // x^(-1) или x^-1 или k/x
            const overMatch = trimmed.match(new RegExp(`^([+-]?)(\\d*)\\*?${v}\\^\\(?-1\\)?$`));
            const overMatch2 = trimmed.match(new RegExp(`^([+-]?)(\\d*)\\*?/${v}$`));
            if (powMatch) {
              const n = parseInt(powMatch[3], 10);
              if (n === -1) {
                const b = parseFloat(powMatch[2] || '1') * (powMatch[1] === '-' ? -1 : 1);
                terms.push(`${b}*log(abs(${variable}))`);
              } else {
                const a = parseFloat(powMatch[2] || '1') * (powMatch[1] === '-' ? -1 : 1);
                terms.push(`${a}/${n + 1}*${variable}^${n + 1}`);
              }
            } else if (linMatch) {
              const a = parseFloat(linMatch[2] || '1') * (linMatch[1] === '-' ? -1 : 1);
              terms.push(`${a}/2*${variable}^2`);
            } else if (overMatch || overMatch2) {
              const m = overMatch || overMatch2;
              const b = parseFloat(m![2] || '1') * (m![1] === '-' ? -1 : 1);
              terms.push(`${b}*log(abs(${variable}))`);
            }
          }
          if (terms.length > 0) {
            const res = terms.join('+').replace(/\+\-/g, '-') + ' + C';
            this.integralResult = {
              result: res,
              method: 'substitution',
              substitution: {
                u: `разложение (${numStr})/${variable} на слагаемые`,
                du: variable,
                integrandU: 'сумма степеней x и 1/x',
                antiderivU: 'почленное интегрирование',
              },
            };
            return this.integralResult.result;
          }
          // Fallback: ручное разложение (ax^n+...+b)/x
          const numTerms = numStr.split(/(?=[+-])/).filter(Boolean);
          const byPower: Record<number, number> = {};
          for (const t of numTerms) {
            const m = t.trim().match(new RegExp(`^([+-]?)(\\d*)\\*?${v}\\^(\\d+)$`));
            const linear = t.trim().match(new RegExp(`^([+-]?)(\\d*)\\*?${v}$`));
            const constant = t.trim().match(/^([+-]?)(\d+)$/);
            if (m) {
              const c = parseFloat(m[2] || '1') * (m[1] === '-' ? -1 : 1);
              const p = parseInt(m[3], 10);
              byPower[p] = (byPower[p] || 0) + c;
            } else if (linear) {
              const c = parseFloat(linear[2] || '1') * (linear[1] === '-' ? -1 : 1);
              byPower[1] = (byPower[1] || 0) + c;
            } else if (constant) {
              const c = parseFloat(constant[2]) * (constant[1] === '-' ? -1 : 1);
              byPower[0] = (byPower[0] || 0) + c;
            }
          }
          const manualTerms: string[] = [];
          for (const [pow, coeff] of Object.entries(byPower).map(([p, c]) => [parseInt(p, 10), c as number])) {
            if (coeff === 0) continue;
            // (coeff*x^p)/x = coeff*x^(p-1); ∫coeff*x^(p-1)dx = coeff*x^p/p при p>0, и coeff*log|x| при p=0
            if (pow === 0) manualTerms.push(`${coeff}*log(abs(${variable}))`);
            else if (pow === 1) manualTerms.push(`${coeff}*${variable}`);
            else manualTerms.push(`${coeff}/${pow}*${variable}^${pow}`);
          }
          if (manualTerms.length > 0) {
            const res = manualTerms.join('+').replace(/\+\-/g, '-') + ' + C';
            this.integralResult = { result: res, method: 'substitution', substitution: { u: 'разложение на слагаемые', du: variable } };
            return this.integralResult.result;
          }
        } catch {}
      }

      // ∫(многочлен)/(линейный) — div в Nerdamer + точное интегрирование (покрывает высокие степени)
      const quadLin = this.tryIntegralPolynomialOverLinear(cleanExpr, variable);
      if (quadLin) return quadLin;

      // === МЕТОД ПОДСТАНОВКИ (замена переменной) ===
      
      // ∫x*exp(ax^2+b)dx — подстановка u = ax^2+b, du = 2ax dx → ∫ = exp(u)/(2a) + C
      const v = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const xExpAx2bMatch = cleanExpr.match(new RegExp(`${v}\\*exp\\((\\d*)\\*?${v}\\^2(\\+(\\d+))?\\)`));
      if (xExpAx2bMatch) {
        const a = parseInt(xExpAx2bMatch[1] || '1', 10);
        const b = xExpAx2bMatch[3] != null ? parseInt(xExpAx2bMatch[3], 10) : 0;
        const uExpr = b !== 0 ? `${a}*${variable}^2+${b}` : (a !== 1 ? `${a}*${variable}^2` : `${variable}^2`);
        const denom = 2 * a;
        const result = denom > 1 ? `exp(${uExpr})/${denom} + C` : `exp(${uExpr}) + C`;
        const coeff = denom > 1 ? `1/${denom}` : '1';
        this.integralResult = {
          result,
          method: 'substitution',
          substitution: {
            u: uExpr,
            du: `${2 * a}*${variable} d${variable}`,
            dxExpr: `d${variable} = du/(${2 * a}*${variable})`,
            integrandU: `${coeff}*exp(u)`,
            antiderivU: `${coeff}*exp(u) + C`,
          },
        };
        return this.integralResult.result;
      }

      // ∫x*exp(x^2)dx — подстановка u = x^2, du = 2x dx
      const xExpX2Match = cleanExpr.match(new RegExp(`${variable}\\*exp\\(${variable}\\^2\\)`));
      if (xExpX2Match) {
        this.integralResult = {
          result: `exp(${variable}^2)/2 + C`,
          method: 'substitution',
          substitution: {
            u: `${variable}^2`,
            du: `2${variable} d${variable}`,
            dxExpr: `d${variable} = du/(2${variable})`,
            integrandU: `(1/2)*exp(u)`,
            antiderivU: `(1/2)*exp(u) + C`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫k*x*exp(ax^2+b)dx при k=2a — подстановка u=ax^2+b, du=k*x dx
      const kxExpAx2bMatch = cleanExpr.match(new RegExp(`(\\d+)\\*?${v}\\*exp\\((\\d*)\\*?${v}\\^2(\\+(\\d+))?\\)`));
      if (kxExpAx2bMatch) {
        const k = parseInt(kxExpAx2bMatch[1], 10);
        const a = parseInt(kxExpAx2bMatch[2] || '1', 10);
        const b = kxExpAx2bMatch[4] != null ? parseInt(kxExpAx2bMatch[4], 10) : 0;
        if (k === 2 * a) {
          const uExpr = b !== 0 ? `${a}*${variable}^2+${b}` : (a !== 1 ? `${a}*${variable}^2` : `${variable}^2`);
          this.integralResult = {
            result: `exp(${uExpr}) + C`,
            method: 'substitution',
            substitution: {
              u: uExpr,
              du: `${k}*${variable} d${variable}`,
              dxExpr: `d${variable} = du/(${k}*${variable})`,
              integrandU: `exp(u)`,
              antiderivU: `exp(u) + C`,
            },
          };
          return this.integralResult.result;
        }
      }
      
      // ∫1/(x+a)dx — подстановка u = x+a
      const oneOverLinearMatch = cleanExpr.match(new RegExp(`1/\\(${variable}\\+([^)]+)\\)`));
      if (oneOverLinearMatch) {
        const a = oneOverLinearMatch[1];
        this.integralResult = {
          result: `log(abs(${variable}+${a})) + C`,
          method: 'substitution',
          substitution: {
            u: `${variable}+${a}`,
            du: `d${variable}`,
            dxExpr: `d${variable} = du`,
            integrandU: `1/u`,
            antiderivU: `log(abs(u)) + C`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫1/(ax+b)dx при a≠1 — подстановка u = ax+b
      const oneOverAxbMatch = cleanExpr.match(new RegExp(`1/\\(([0-9]+)${variable}\\+([^)]+)\\)`));
      if (oneOverAxbMatch) {
        const a = parseInt(oneOverAxbMatch[1]);
        const b = oneOverAxbMatch[2];
        this.integralResult = {
          result: `log(abs(${a}${variable}+${b}))/${a} + C`,
          method: 'substitution',
          substitution: {
            u: `${a}${variable}+${b}`,
            du: `${a} d${variable}`,
            dxExpr: `d${variable} = du/${a}`,
            integrandU: `(1/${a})*(1/u)`,
            antiderivU: `(1/${a})*log(abs(u)) + C`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫2x/(x^2+1)dx — подстановка u = x^2+1
      const twoXOverX2Plus1Match = cleanExpr.match(/2\*?x\*?\/\*?\(x\^2\+1\)/);
      if (twoXOverX2Plus1Match) {
        this.integralResult = {
          result: `log(abs(${variable}^2+1)) + C`,
          method: 'substitution',
          substitution: {
            u: `${variable}^2+1`,
            du: `2${variable} d${variable}`,
            dxExpr: `d${variable} = du/(2${variable})`,
            integrandU: `1/u`,
            antiderivU: `log(abs(u)) + C`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫x/(x^2+1)dx — подстановка u = x^2+1
      const xOverX2Plus1Match = cleanExpr.match(new RegExp(`${variable}/\\s*\\(${variable}\\^2\\+1\\)`));
      if (xOverX2Plus1Match) {
        this.integralResult = {
          result: `log(abs(${variable}^2+1))/2 + C`,
          method: 'substitution',
          substitution: {
            u: `${variable}^2+1`,
            du: `2${variable} d${variable}`,
            dxExpr: `d${variable} = du/(2${variable})`,
            integrandU: `(1/2)*(1/u)`,
            antiderivU: `(1/2)*log(abs(u)) + C`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫(x+a)^n dx — подстановка u = x+a
      const linearPowerMatch = cleanExpr.match(new RegExp(`\\(${variable}\\+([^)]+)\\)\\^(\\d+)`));
      if (linearPowerMatch) {
        const a = linearPowerMatch[1];
        const n = parseInt(linearPowerMatch[2]);
        const newPower = n + 1;
        this.integralResult = { result: `(${variable}+${a})^${newPower}/${newPower} + C`, method: 'substitution', substitution: { u: `${variable}+${a}`, du: `d${variable}` } };
        return this.integralResult.result;
      }
      
      // ∫(ax+b)^n dx при a≠1 — подстановка u = ax+b
      const axbPowerMatch = cleanExpr.match(new RegExp(`\\(([0-9]+)${variable}\\+([^)]+)\\)\\^(\\d+)`));
      if (axbPowerMatch) {
        const a = parseInt(axbPowerMatch[1]);
        const b = axbPowerMatch[2];
        const n = parseInt(axbPowerMatch[3]);
        const newPower = n + 1;
        this.integralResult = { result: `(${a}${variable}+${b})^${newPower}/(${a}*${newPower}) + C`, method: 'substitution', substitution: { u: `${a}${variable}+${b}`, du: `${a} d${variable}` } };
        return this.integralResult.result;
      }
      
      // ∫sin(ax)dx, ∫cos(ax)dx при a≠1 — подстановка u = ax
      const sinAxMatch = cleanExpr.match(/sin\(([0-9]+)x\)/);
      if (sinAxMatch) {
        const a = parseInt(sinAxMatch[1]);
        if (a !== 1) {
          this.integralResult = { result: `-cos(${a}${variable})/${a} + C`, method: 'substitution', substitution: { u: `${a}${variable}`, du: `${a} d${variable}` } };
          return this.integralResult.result;
        }
      }
      
      const cosAxMatch = cleanExpr.match(/cos\(([0-9]+)x\)/);
      if (cosAxMatch) {
        const a = parseInt(cosAxMatch[1]);
        if (a !== 1) {
          this.integralResult = { result: `sin(${a}${variable})/${a} + C`, method: 'substitution', substitution: { u: `${a}${variable}`, du: `${a} d${variable}` } };
          return this.integralResult.result;
        }
      }
      
      // === ИНТЕГРИРОВАНИЕ ПО ЧАСТЯМ ===
      
      // ∫log(x)dx или ∫ln(x)dx — по частям: u=log(x), dv=dx
      if (cleanExpr === `log(${variable})`) {
        this.integralResult = { result: `${variable}*log(${variable})-${variable} + C`, method: 'by_parts', byParts: { u: `log(${variable})`, dv: `d${variable}`, du: `1/${variable} d${variable}`, v: variable } };
        return this.integralResult.result;
      }
      
      // ∫x*log(x)dx или ∫x*ln(x)dx — по частям: u=log(x), dv=x dx
      if (cleanExpr === `${variable}*log(${variable})` || cleanExpr === `log(${variable})*${variable}`) {
        this.integralResult = { result: `${variable}^2*log(${variable})/2-${variable}^2/4 + C`, method: 'by_parts', byParts: { u: `log(${variable})`, dv: `${variable} d${variable}`, du: `1/${variable} d${variable}`, v: `${variable}^2/2` } };
        return this.integralResult.result;
      }

      // ∫x^2*log(x)dx — по частям: u=log(x), dv=x^2 dx
      if (
        cleanExpr === `${variable}^2*log(${variable})` ||
        cleanExpr === `log(${variable})*${variable}^2`
      ) {
        const x = variable;
        this.integralResult = {
          result: `${x}^3*log(${x})/3-${x}^3/9 + C`,
          method: 'by_parts',
          byParts: {
            u: `log(${x})`,
            dv: `${x}^2 d${x}`,
            du: `1/${x} d${x}`,
            v: `${x}^3/3`,
            uv: `${x}^3/3*log(${x})`,
            remainingIntegral: `∫(${x}^2/3) d${x} = ${x}^3/9`,
          },
        };
        return this.integralResult.result;
      }

      // ∫(ax^2+b)*log(x)dx — по частям: u=log(x), dv=(ax^2+b)dx. Пример: (4x^2+2)*log(x)
      const ax2bLogMatch = cleanExpr.match(new RegExp(`^\\((\\d+)\\*?${v}\\^2\\+(\\d+)\\)\\*log\\(${v}\\)$`)) || cleanExpr.match(new RegExp(`^log\\(${v}\\)\\*\\((\\d+)\\*?${v}\\^2\\+(\\d+)\\)$`));
      if (ax2bLogMatch) {
        const a = parseInt(ax2bLogMatch[1], 10);
        const b = parseInt(ax2bLogMatch[2], 10);
        const vStr = `${a}*${variable}^3/3+${b}*${variable}`;
        const remStr = `${a}*${variable}^3/9+${b}*${variable}`;
        const result = `(${vStr})*log(${variable})-(${remStr}) + C`;
        this.integralResult = {
          result,
          method: 'by_parts',
          byParts: {
            u: `log(${variable})`,
            dv: `(${a}*${variable}^2+${b}) d${variable}`,
            du: `1/${variable} d${variable}`,
            v: vStr,
            uv: `(${vStr})*log(${variable})`,
            remainingIntegral: `∫(${a}*${variable}^2/3+${b}) d${variable} = ${remStr}`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫x*exp(x)dx — по частям: u=x, dv=exp(x)dx
      if (cleanExpr === `${variable}*exp(${variable})` || cleanExpr === `exp(${variable})*${variable}`) {
        this.integralResult = {
          result: `(${variable}-1)*exp(${variable}) + C`,
          method: 'by_parts',
          byParts: {
            u: variable,
            dv: `exp(${variable}) d${variable}`,
            du: `d${variable}`,
            v: `exp(${variable})`,
            uv: `${variable}*exp(${variable})`,
            remainingIntegral: `∫exp(${variable}) d${variable} = exp(${variable})`,
          },
        };
        return this.integralResult.result;
      }
      
      // ∫x^2*exp(x)dx — по частям дважды
      if (cleanExpr === `${variable}^2*exp(${variable})` || cleanExpr === `exp(${variable})*${variable}^2`) {
        this.integralResult = { result: `(${variable}^2-2*${variable}+2)*exp(${variable}) + C`, method: 'by_parts', byParts: { u: `${variable}^2`, dv: `exp(${variable}) d${variable}`, du: `2*${variable} d${variable}`, v: `exp(${variable})` } };
        return this.integralResult.result;
      }
      
      // ∫x*sin(x)dx — по частям: u=x, dv=sin(x)dx
      if (cleanExpr === `${variable}*sin(${variable})` || cleanExpr === `sin(${variable})*${variable}`) {
        this.integralResult = { result: `sin(${variable})-${variable}*cos(${variable}) + C`, method: 'by_parts', byParts: { u: variable, dv: `sin(${variable}) d${variable}`, du: `d${variable}`, v: `-cos(${variable})` } };
        return this.integralResult.result;
      }
      
      // ∫x*cos(x)dx — по частям: u=x, dv=cos(x)dx
      if (cleanExpr === `${variable}*cos(${variable})` || cleanExpr === `cos(${variable})*${variable}`) {
        this.integralResult = { result: `cos(${variable})+${variable}*sin(${variable}) + C`, method: 'by_parts', byParts: { u: variable, dv: `cos(${variable}) d${variable}`, du: `d${variable}`, v: `sin(${variable})` } };
        return this.integralResult.result;
      }
      
      // ∫exp(x)*sin(x)dx — по частям дважды (круговой)
      if ((cleanExpr === `exp(${variable})*sin(${variable})` || cleanExpr === `sin(${variable})*exp(${variable})`)) {
        this.integralResult = { result: `exp(${variable})*(sin(${variable})-cos(${variable}))/2 + C`, method: 'by_parts', byParts: { u: `sin(${variable})`, dv: `exp(${variable}) d${variable}`, du: `cos(${variable}) d${variable}`, v: `exp(${variable})` } };
        return this.integralResult.result;
      }
      
      // ∫exp(x)*cos(x)dx
      if ((cleanExpr === `exp(${variable})*cos(${variable})` || cleanExpr === `cos(${variable})*exp(${variable})`)) {
        this.integralResult = { result: `exp(${variable})*(sin(${variable})+cos(${variable}))/2 + C`, method: 'by_parts', byParts: { u: `cos(${variable})`, dv: `exp(${variable}) d${variable}`, du: `-sin(${variable}) d${variable}`, v: `exp(${variable})` } };
        return this.integralResult.result;
      }
      
      // === РАЦИОНАЛЬНЫЕ ФУНКЦИИ (poly)/x ===
      // (4x^2+2)/x = 4x + 2/x → ∫ = 2x^2 + 2*log(abs(x))
      const rationalOverXMatch = cleanExpr.match(new RegExp(`^\\(([^)]+)\\)\\/${variable}$`));
      if (rationalOverXMatch) {
        const num = rationalOverXMatch[1];
        // Разбиваем по + и - на слагаемые: 4x^2, 2 или 4x^2, -2
        const terms = num.split(/(?=[+-])/).map(t => t.trim()).filter(Boolean);
        const results: string[] = [];
        for (const term of terms) {
          if (!term) continue;
          const coeffX2 = term.match(new RegExp(`^(\\d+)\\*?${variable}\\^2$`));
          const coeffX = term.match(new RegExp(`^(\\d+)\\*?${variable}$`));
          const constTerm = term.match(/^([+-]?\d+)$/);
          if (coeffX2) {
            const a = parseInt(coeffX2[1]);
            results.push(`${a}/2*${variable}^2`);
          } else if (coeffX) {
            const a = parseInt(coeffX[1]);
            results.push(`${a}/2*${variable}^2`);
          } else if (constTerm) {
            const b = parseInt(constTerm[1], 10);
            results.push(`${b}*log(abs(${variable}))`);
          } else {
            const coeffXn = term.match(new RegExp(`^(\\d+)\\*?${variable}\\^(\\d+)$`));
            if (coeffXn) {
              const a = parseInt(coeffXn[1]);
              const n = parseInt(coeffXn[2]);
              const newN = n - 1;
              if (newN === 0) results.push(`${a}*log(abs(${variable}))`);
              else results.push(`${a}/${newN}*${variable}^${newN}`);
            }
          }
        }
        if (results.length > 0) {
          this.integralResult = { result: results.join('+') + ' + C', method: 'substitution', substitution: { u: 'разложение на слагаемые', du: `${variable}` } };
          return this.integralResult.result;
        }
      }

      // === ТАБЛИЦА ИЗВЕСТНЫХ ИНТЕГРАЛОВ ===
      
      const integralTable: { [key: string]: string } = {
        [`${variable}`]: `${variable}^2/2`,
        [`${variable}^2`]: `${variable}^3/3`,
        [`${variable}^3`]: `${variable}^4/4`,
        [`${variable}^4`]: `${variable}^5/5`,
        [`sin(${variable})`]: `-cos(${variable})`,
        [`cos(${variable})`]: `sin(${variable})`,
        [`tan(${variable})`]: `-log(abs(cos(${variable})))`,
        [`exp(${variable})`]: `exp(${variable})`,
        [`e^${variable}`]: `exp(${variable})`,
        [`1/${variable}`]: `log(abs(${variable}))`,
      };

      if (integralTable[cleanExpr]) {
        const formula = integralTable[cleanExpr];
        this.integralResult = {
          result: formula + ' + C',
          method: 'table',
          tableRule: `формула ∫${cleanExpr} dx = ${formula}`,
        };
        return this.integralResult.result;
      }

      // ∫sin(x)*cos(x)dx
      if (cleanExpr === `sin(${variable})*cos(${variable})` || cleanExpr === `cos(${variable})*sin(${variable})`) {
        this.integralResult = { result: `sin(${variable})^2/2 + C`, method: 'table' };
        return this.integralResult.result;
      }

      // ∫x^n — правило степени
      const powerMatch = cleanExpr.match(new RegExp(`^${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\^(\\d+)$`));
      if (powerMatch) {
        const power = parseInt(powerMatch[1]);
        const newPower = power + 1;
        this.integralResult = {
          result: `1/${newPower}*${variable}^${newPower} + C`,
          method: 'table',
          tableRule: `∫x^n dx = x^(n+1)/(n+1) при n = ${power}`,
        };
        return this.integralResult.result;
      }

      // ∫a*x^n
      const coeffPowerMatch = cleanExpr.match(new RegExp(`^(\\d+)\\*${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\^(\\d+)$`));
      if (coeffPowerMatch) {
        const coeff = parseInt(coeffPowerMatch[1]);
        const power = parseInt(coeffPowerMatch[2]);
        const newPower = power + 1;
        this.integralResult = {
          result: `${coeff}/${newPower}*${variable}^${newPower} + C`,
          method: 'table',
          tableRule: `∫a·x^n dx = a·x^(n+1)/(n+1) при a = ${coeff}, n = ${power}`,
        };
        return this.integralResult.result;
      }

      this.integralResult = { result: `∫(${expression})d${variable} + C`, method: 'table' };
      return this.integralResult.result;
    } catch (error) {
      return 'C';
    }
  }

  /** Ньютон—Лейбниц, если simplifyIntegral дал осмысленную первообразную */
  private tryNewtonLeibnizDefinite(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number }
  ): { value: number; indefinite: string } | null {
    const indefinite = this.simplifyIntegral(expression, variable);
    if (this.isIndefiniteUnusableForDefinite(indefinite, expression, variable)) {
      return null;
    }
    let F = indefinite.replace(/\s*\+\s*C\s*$/i, '').trim();
    if (F === indefinite) {
      F = F.replace(/\+C/gi, '').trim();
    }
    const upper = this.evaluateExpression(F, variable, bounds.upper);
    const lower = this.evaluateExpression(F, variable, bounds.lower);
    if (!Number.isFinite(upper) || !Number.isFinite(lower)) {
      return null;
    }
    const value = upper - lower;
    return Number.isFinite(value) ? { value, indefinite } : null;
  }

  /** F(b)−F(a) по уже найденной строке первообразной (+ C) — для рациональной дроби (многочлен)/(линейный) */
  private tryNewtonLeibnizFromIndefinite(
    indefiniteWithC: string,
    variable: string,
    bounds: { lower: number; upper: number }
  ): { value: number; indefinite: string } | null {
    let F = indefiniteWithC.replace(/\s*\+\s*C\s*$/i, '').trim();
    if (F === indefiniteWithC) {
      F = F.replace(/\+C/gi, '').trim();
    }
    const upper = this.evaluateExpression(F, variable, bounds.upper);
    const lower = this.evaluateExpression(F, variable, bounds.lower);
    if (!Number.isFinite(upper) || !Number.isFinite(lower)) {
      return null;
    }
    const value = upper - lower;
    return Number.isFinite(value) ? { value, indefinite: indefiniteWithC } : null;
  }

  private isIndefiniteUnusableForDefinite(indefinite: string, expr: string, variable: string): boolean {
    const s = indefinite.trim();
    if (s.includes('Не удалось')) return true;
    if (s === 'C') return true;
    return this.isUnevaluatedIntegralPlaceholder(indefinite, expr, variable);
  }

  /** Округление численного ответа для определённого интеграла */
  private formatDefiniteNumericResult(value: number): string {
    if (!Number.isFinite(value)) return String(value);
    if (Math.abs(value) < 1e-14) return '0';
    const abs = Math.abs(value);
    if (abs >= 1e9 || (abs > 0 && abs < 1e-8)) return value.toExponential(10);
    return String(Math.round(value * 1e12) / 1e12);
  }

  /**
   * Составной метод Симпсона (n=512): запасной путь, когда нет символьной первообразной.
   */
  private numericalDefiniteIntegralSimpson(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number }
  ): number | null {
    const a = bounds.lower;
    const b = bounds.upper;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    if (a === b) return 0;
    let prep = this.normalizeExpression(expression).replace(/\s/g, '').replace(/ln\(/g, 'log(');
    try {
      const node = math.parse(prep);
      const compiled = node.compile();
      const f = (t: number): number => {
        try {
          const y = compiled.evaluate({ [variable]: t }) as number;
          return typeof y === 'number' && Number.isFinite(y) ? y : NaN;
        } catch {
          return NaN;
        }
      };
      let n = 512;
      const h = (b - a) / n;
      let sum = f(a) + f(b);
      if (!Number.isFinite(sum)) return null;
      for (let i = 1; i < n; i++) {
        const x = a + i * h;
        const yi = f(x);
        if (!Number.isFinite(yi)) return null;
        const coef = i % 2 === 0 ? 2 : 4;
        sum += coef * yi;
      }
      const res = (sum * h) / 3;
      return Number.isFinite(res) ? res : null;
    } catch {
      return null;
    }
  }

  private getDefiniteIntegralStepsNewtonLeibniz(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number },
    indefinite: string,
    value: number
  ): string[] {
    let F = indefinite.replace(/\s*\+\s*C\s*$/i, '').trim();
    if (F === indefinite) F = F.replace(/\+C/gi, '').trim();
    const Fu = this.evaluateExpression(F, variable, bounds.upper);
    const Fl = this.evaluateExpression(F, variable, bounds.lower);
    return [
      `Шаг 1. Записываем определённый интеграл: ∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      `Шаг 2. Находим первообразную F(${variable}) (неопределённый интеграл):`,
      `   F(${variable}) = ${indefinite}`,
      `Шаг 3. Формула Ньютона—Лейбница: ∫[a→b] f(${variable}) d${variable} = F(b) − F(a)`,
      `   F(${bounds.upper}) = ${Fu}`,
      `   F(${bounds.lower}) = ${Fl}`,
      `   F(${bounds.upper}) − F(${bounds.lower}) = ${value}`,
      `Результат: ${this.formatDefiniteNumericResult(value)}`,
    ];
  }

  private getDefiniteIntegralStructuredNewtonLeibniz(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number },
    indefinite: string,
    value: number
  ): IntegralStepStructured[] {
    let F = indefinite.replace(/\s*\+\s*C\s*$/i, '').trim();
    if (F === indefinite) F = F.replace(/\+C/gi, '').trim();
    const Fu = this.evaluateExpression(F, variable, bounds.upper);
    const Fl = this.evaluateExpression(F, variable, bounds.lower);
    return [
      {
        actionLabel: 'Определённый интеграл',
        expression: `∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      },
      {
        actionLabel: 'Первообразная',
        rule: {
          name: 'Ньютон—Лейбниц',
          formula: `\\int_a^b f(${variable})\\,d${variable} = F(b)-F(a)`,
        },
        expressionAfter: `F(${variable}) = ${indefinite}`,
      },
      {
        actionLabel: 'Подстановка пределов',
        expression: `F(${bounds.upper})=${Fu}, F(${bounds.lower})=${Fl} \\Rightarrow ${this.formatDefiniteNumericResult(value)}`,
      },
    ];
  }

  private getDefiniteIntegralStepsNumerical(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number },
    approximation: number
  ): string[] {
    return [
      `Шаг 1. Записываем: ∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      `Шаг 2. Табличные правила и символьный defint (Nerdamer) не дали ответа — переходим к численному интегрированию.`,
      `Шаг 3. Составной метод Симпсона (512 частей отрезка [${bounds.lower}; ${bounds.upper}]):`,
      `Результат (приближённо): ≈ ${this.formatDefiniteNumericResult(approximation)}`,
    ];
  }

  private getDefiniteIntegralStructuredNumerical(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number },
    approximation: number
  ): IntegralStepStructured[] {
    return [
      {
        actionLabel: 'Определённый интеграл',
        expression: `∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      },
      {
        actionLabel: 'Численно',
        rule: {
          name: 'Метод Симпсона',
          formula: '\\int_a^b f(x)dx \\approx \\frac{h}{3}\\bigl(f(a)+f(b)+4\\sum f(x_{2k-1})+2\\sum f(x_{2k})\\bigr)',
        },
        expressionAfter: `\\approx ${this.formatDefiniteNumericResult(approximation)}`,
      },
    ];
  }

  private getDefiniteIntegralFailureSteps(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number }
  ): string[] {
    return [
      `∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      'Символьное интегрирование недоступно, численная оценка на отрезке не сошлась (разрывы, особенности, выход за область определения log/sqrt и т.д.).',
      'Попробуйте изменить пределы или упростить подынтегральное выражение.',
    ];
  }

  private getDefiniteIntegralStructuredFailure(
    expression: string,
    variable: string,
    bounds: { lower: number; upper: number }
  ): IntegralStepStructured[] {
    return [
      {
        actionLabel: 'Определённый интеграл',
        expression: `∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      },
      {
        actionLabel: 'Не вычислено',
        rule: {
          name: 'Проверьте область определения и особенности на [a; b]',
        },
      },
    ];
  }

  /** Подстановка числа в выражение первообразной (через mathjs scope, без глобальной замены подстрок) */
  private evaluateExpression(expression: string, variable: string, value: number): number {
    const prep = expression.replace(/\s/g, '').replace(/ln\(/g, 'log(');
    try {
      const y = math.evaluate(prep, { [variable]: value }) as number;
      return typeof y === 'number' && Number.isFinite(y) ? y : NaN;
    } catch {
      return NaN;
    }
  }

  private getDerivativeSteps(expression: string, variable: string): string[] {
    return [
      `Исходная функция: ${expression}`,
      'Применяем правила дифференцирования:',
      '• d/dx(x^n) = n*x^(n-1)',
      '• d/dx(c*x) = c',
      '• d/dx(c) = 0',
      `Результат: ${this.simplifyDerivative(expression, variable)}`
    ];
  }

  private getIntegralSteps(expression: string, variable: string): string[] {
    const result = this.simplifyIntegral(expression, variable);
    const steps: string[] = [];

    steps.push(`Шаг 1. Записываем интеграл: ∫(${expression}) d${variable}`);

    if (this.integralResult.rationalQuadraticOverLinear) {
      const rq = this.integralResult.rationalQuadraticOverLinear;
      const remPart =
        rq.remainderStr !== undefined && rq.remainderStr !== '0'
          ? `${rq.remainderStr}/(${rq.denomInnerStr})`
          : Math.abs(rq.remainder) > 1e-10
            ? `${this.formatShortCoeff(rq.remainder)}/(${rq.denomInnerStr})`
            : '';
      const hasRem = Boolean(remPart);
      const remForIdentity = rq.remainderStr !== undefined ? rq.remainderStr : String(rq.remainder);
      steps.push(`Шаг 2. Делим многочлен в числителе на линейный знаменатель (${rq.denomStr}):`);
      steps.push(`   (${rq.numerStr}) = (${rq.quotientStr})·(${rq.denomStr}) + ${remForIdentity}`);
      steps.push(
        hasRem
          ? `   (${rq.numerStr})/(${rq.denomStr}) = ${rq.quotientStr} + ${remPart}`
          : `   (${rq.numerStr})/(${rq.denomStr}) = ${rq.quotientStr}`
      );
      steps.push(`Шаг 3. Интегрируем почленно и упрощаем:`);
      steps.push(`   ${result}`);
      return steps;
    }

    if (this.integralResult.method === 'substitution' && this.integralResult.substitution) {
      const sub = this.integralResult.substitution;
      steps.push(`Шаг 2. Применяем подстановку (метод замены переменной):`);
      steps.push(`   Положим u = ${sub.u}`);
      steps.push(`Шаг 3. Вычисляем дифференциал: du = ${sub.du}`);
      if (sub.dxExpr) {
        steps.push(`   Следовательно ${sub.dxExpr}`);
      }
      if (sub.integrandU && sub.antiderivU) {
        steps.push(`Шаг 4. Подставляем в интеграл. Интеграл принимает вид: ∫ ${sub.integrandU} du`);
        steps.push(`Шаг 5. Вычисляем интеграл по u: ∫ ${sub.integrandU} du = ${sub.antiderivU}`);
        steps.push(`Шаг 6. Обратная подстановка u = ${sub.u}:`);
      } else {
        steps.push(`Шаг 4. Подставляем в интеграл и интегрируем по новой переменной u`);
        steps.push(`Шаг 5. Обратная подстановка u = ${sub.u}:`);
      }
      steps.push(`   ${result}`);
    } else if (this.integralResult.method === 'by_parts' && this.integralResult.byParts) {
      const bp = this.integralResult.byParts;
      const xv = variable;
      // ∫ x² e^x — два раза по частям + подзадачи (1), (2) (как MathDF)
      if (this.isByPartsXSquaredExp(bp, xv)) {
        steps.push(`Шаг 2. Первое интегрирование по частям: u = ${xv}^2, dv = e^${xv} d${xv}`);
        steps.push(`   du = 2*${xv} d${xv}, v = e^${xv}`);
        steps.push(`Шаг 3. Получаем: ${xv}^2·e^${xv} − ∫ 2*${xv}·e^${xv} d${xv} = ${xv}^2·e^${xv} − (1)`);
        steps.push(`Шаг 4. Подзадача (1): ∫ 2*${xv}·e^${xv} d${xv} = 2·∫ ${xv}·e^${xv} d${xv}`);
        steps.push(`Шаг 5. Второе интегрирование по частям для ∫${xv}·e^${xv} d${xv}: u = ${xv}, dv = e^${xv} d${xv}`);
        steps.push(`   du = d${xv}, v = e^${xv}  ⇒  ${xv}·e^${xv} − ∫ e^${xv} d${xv} = ${xv}·e^${xv} − (2)`);
        steps.push(`Шаг 6. Подзадача (2): ∫ e^${xv} d${xv} = e^${xv} (табличный интеграл)`);
        steps.push(`Шаг 7. Тогда (1): 2·((${xv}−1)·e^${xv}) = 2*${xv}·e^${xv} − 2·e^${xv}`);
        steps.push(`Шаг 8. Итого: ${xv}^2·e^${xv} − 2*${xv}·e^${xv} + 2·e^${xv} = (${xv}^2 − 2*${xv} + 2)·e^${xv} + C`);
        steps.push(`   ${result}`);
        return steps;
      }
      steps.push(`Шаг 2. Применяем интегрирование по частям: ∫u·dv = u·v − ∫v·du`);
      steps.push(`Шаг 3. Выбираем u и dv:`);
      steps.push(`   u = ${bp.u}  ⇒  du = ${bp.du}`);
      steps.push(`   dv = ${bp.dv}  ⇒  v = ${bp.v}`);
      steps.push(`Шаг 4. Подставляем в формулу:`);
      steps.push(`   ∫(${expression}) d${variable} = u·v − ∫v·du`);
      if (bp.uv) {
        steps.push(`   = ${bp.uv} − ∫${bp.v}·${bp.du.replace(/ d\w+$/, '')} d${variable}`);
      }
      if (bp.remainingIntegral) {
        steps.push(`Шаг 5. Вычисляем оставшийся интеграл: ${bp.remainingIntegral}`);
      }
      steps.push(`Шаг 6. Упрощаем:`);
      steps.push(`   ${result}`);
    } else {
      if (this.integralResult.tableRule) {
        steps.push(`Шаг 2. ${this.integralResult.tableRule}`);
      } else {
        steps.push(`Шаг 2. Применяем таблицу основных интегралов:`);
      }
      steps.push(`   • ∫x^n dx = x^(n+1)/(n+1) + C`);
      steps.push(`   • ∫sin(x)dx = -cos(x) + C, ∫cos(x)dx = sin(x) + C`);
      steps.push(`   • ∫e^x dx = e^x + C, ∫(1/x)dx = ln|x| + C`);
      steps.push(`Шаг 3. Получаем:`);
      steps.push(`   ${result}`);
    }

    return steps;
  }

  /**
   * LaTeX в стиле MathDF: дроби через \\frac, ln → \\ln, без \\div.
   */
  private toLatex(expression: string): string {
    let prep = expression.replace(/\s/g, '').replace(/ln\(/g, 'log(');
    try {
      const node = math.parse(prep);
      return this.mathNodeToLatex(node);
    } catch {
      return this.toLatexFallback(prep);
    }
  }

  /** Преобразует AST mathjs в LaTeX (как на MathDF) */
  private mathNodeToLatex(node: math.MathNode): string {
    const n = node as any;

    if (node.type === 'ConstantNode') {
      return String(n.value);
    }

    if (node.type === 'SymbolNode') {
      const name = n.name as string;
      if (name === 'log') return '\\log'; // не должно встречаться как символ
      return name;
    }

    if (node.type === 'ParenthesisNode') {
      return `\\left(${this.mathNodeToLatex(n.content)}\\right)`;
    }

    if (node.type === 'FunctionNode') {
      const fnName = n.fn.name as string;
      const arg = n.args[0];
      const argL = this.mathNodeToLatex(arg);

      if (fnName === 'log') {
        if (arg.type === 'SymbolNode') {
          return `\\ln ${argL}`;
        }
        return `\\ln\\left(${argL}\\right)`;
      }
      if (fnName === 'exp') {
        return `e^{${argL}}`;
      }
      if (fnName === 'sin' || fnName === 'cos' || fnName === 'tan' || fnName === 'cot') {
        return `\\${fnName}\\left(${argL}\\right)`;
      }
      if (fnName === 'sqrt') {
        return `\\sqrt{${argL}}`;
      }
      if (fnName === 'abs') {
        return `\\left|${argL}\\right|`;
      }
      return `\\operatorname{${fnName}}\\left(${argL}\\right)`;
    }

    if (node.type === 'OperatorNode') {
      const op = n.op as string;
      const fn = n.fn as string;
      const args = n.args as math.MathNode[];

      if (fn === 'unaryMinus') {
        const inner = this.mathNodeToLatex(args[0]);
        const needsParen = args[0].type === 'OperatorNode';
        return needsParen ? `-\\left(${inner}\\right)` : `-${inner}`;
      }

      if (op === '/' && fn === 'divide') {
        const num = this.mathNodeToLatex(args[0]);
        const den = this.mathNodeToLatex(args[1]);
        return `\\frac{${num}}{${den}}`;
      }

      if (op === '^') {
        const base = args[0];
        const exp = args[1];
        const baseL = this.mathNodeToLatex(base);
        const expL = this.mathNodeToLatex(exp);
        const baseNeedsParen =
          base.type === 'OperatorNode' &&
          (base as any).fn !== 'divide' &&
          ['add', 'subtract', 'multiply'].includes((base as any).fn);
        const baseStr = baseNeedsParen ? `\\left(${baseL}\\right)` : baseL;
        return `${baseStr}^{${expL}}`;
      }

      if (op === '*' && fn === 'multiply') {
        const a = args[0];
        const b = args[1];
        const leftL = this.mathNodeToLatex(a);
        const rightL = this.mathNodeToLatex(b);
        // Как на MathDF: 4x³, 2x без лишних \cdot
        if (a.type === 'ConstantNode' && b.type === 'SymbolNode') {
          return `${leftL}\\,${rightL}`;
        }
        if (a.type === 'ConstantNode' && b.type === 'OperatorNode' && (b as any).op === '^') {
          return `${leftL}\\,${rightL}`;
        }
        return `${leftL} \\cdot ${rightL}`;
      }

      if (op === '+' && fn === 'add') {
        return `${this.mathNodeToLatex(args[0])} + ${this.mathNodeToLatex(args[1])}`;
      }

      if (op === '-' && fn === 'subtract') {
        return `${this.mathNodeToLatex(args[0])} - ${this.mathNodeToLatex(args[1])}`;
      }
    }

    return this.toLatexFallback(node.toString());
  }

  private toLatexFallback(s: string): string {
    let r = s.replace(/ln\(/g, 'log(').replace(/\s/g, '');
    r = r.replace(/exp\(([^)]+)\)/g, (_, inner) => `e^{${inner.replace(/\*/g, '').trim()}}`);
    r = r.replace(/log\(abs\(([^)]+)\)\)/g, (_, x) => `\\ln|${x}|`);
    r = r.replace(/log\(([^)]+)\)/g, (_, x) => `\\ln(${x.replace(/\*/g, '')})`);
    r = r.replace(/\barctan\(/g, '\\arctan(');
    r = r.replace(/\barcsin\(/g, '\\arcsin(');
    r = r.replace(/\barccos\(/g, '\\arccos(');
    r = r.replace(/\barcctg\(/g, '\\operatorname{arcctg}(');
    r = r.replace(/\*/g, ' \\cdot ');
    const fracMatch = r.match(/^(.+)\/(\d+)\s*\+\s*C$/);
    if (fracMatch) {
      return `\\frac{${fracMatch[1].trim()}}{${fracMatch[2]}} + C`;
    }
    return r.replace(/\//g, ' \\div ');
  }
}

