import { Injectable } from '@nestjs/common';
import { CalculusDto } from './dto/calculus.dto';
import { DerivativeDto, DerivativeAtPointDto } from './dto/derivative.dto';
import { CalculusResult } from './interfaces/calculus-result.interface';
import { DerivativeResult, DerivativeGraphResult, DerivativeAtPointResult, DerivativeStep } from './interfaces/derivative-result.interface';
import * as math from 'mathjs';

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
      
      if (bounds) {
        // Определенный интеграл
        integral = this.simplifyDefiniteIntegral(normalizedExpr, variable, bounds);
        steps = this.getDefiniteIntegralSteps(normalizedExpr, variable, bounds);
      } else {
        // Неопределенный интеграл
        integral = this.simplifyIntegral(normalizedExpr, variable);
        steps = this.getIntegralSteps(normalizedExpr, variable);
      }
      
      const latex = this.toLatex(integral);

      return {
        result: integral,
        steps,
        latex,
      };
    } catch (error) {
      throw new Error(`Ошибка вычисления интеграла: ${error.message}`);
    }
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
    method: 'table' | 'substitution' | 'by_parts';
    substitution?: { u: string; du: string; dxExpr?: string; integrandU?: string; antiderivU?: string };
    byParts?: { u: string; dv: string; du: string; v: string; uv?: string; remainingIntegral?: string };
    tableRule?: string; // конкретная формула из таблицы
  } = { result: '', method: 'table' };

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

  private simplifyDefiniteIntegral(expression: string, variable: string, bounds: { lower: number; upper: number }): string {
    const indefinite = this.simplifyIntegral(expression, variable);
    const upper = this.evaluateExpression(indefinite.replace(' + C', ''), variable, bounds.upper);
    const lower = this.evaluateExpression(indefinite.replace(' + C', ''), variable, bounds.lower);
    return (upper - lower).toString();
  }

  private evaluateExpression(expression: string, variable: string, value: number): number {
    // Упрощенная оценка выражения
    const expr = expression.replace(new RegExp(variable, 'g'), value.toString());
    try {
      return math.evaluate(expr);
    } catch {
      return 0;
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
      const rule = this.integralResult.tableRule || 'таблица основных интегралов';
      steps.push(`Шаг 2. Применяем ${rule}:`);
      steps.push(`   • ∫x^n dx = x^(n+1)/(n+1) + C`);
      steps.push(`   • ∫sin(x)dx = -cos(x) + C, ∫cos(x)dx = sin(x) + C`);
      steps.push(`   • ∫e^x dx = e^x + C, ∫(1/x)dx = ln|x| + C`);
      steps.push(`Шаг 3. Получаем:`);
      steps.push(`   ${result}`);
    }

    return steps;
  }

  private getDefiniteIntegralSteps(expression: string, variable: string, bounds: { lower: number; upper: number }): string[] {
    const indefinite = this.simplifyIntegral(expression, variable);
    const steps: string[] = [
      `Шаг 1. Записываем определённый интеграл: ∫[${bounds.lower}→${bounds.upper}] (${expression}) d${variable}`,
      `Шаг 2. Находим первообразную F(${variable}) (неопределённый интеграл):`,
      `   F(${variable}) = ${indefinite}`,
    ];
    if (this.integralResult.method === 'substitution' && this.integralResult.substitution) {
      steps.push(`   (применён метод подстановки: u = ${this.integralResult.substitution.u})`);
    } else if (this.integralResult.method === 'by_parts' && this.integralResult.byParts) {
      steps.push(`   (применено интегрирование по частям: u = ${this.integralResult.byParts.u})`);
    }
    steps.push(
      `Шаг 3. Применяем формулу Ньютона—Лейбница: ∫[a→b] f(x)dx = F(b) − F(a)`,
      `   F(${bounds.upper}) = ${this.evaluateExpression(indefinite.replace(' + C', ''), variable, bounds.upper)}`,
      `   F(${bounds.lower}) = ${this.evaluateExpression(indefinite.replace(' + C', ''), variable, bounds.lower)}`,
      `Результат: ${this.simplifyDefiniteIntegral(expression, variable, bounds)}`
    );
    return steps;
  }

  private toLatex(expression: string): string {
    let s = expression.replace(/ln\(/g, 'log(').replace(/\s/g, '');
    // exp(expr) → e^{expr}
    s = s.replace(/exp\(([^)]+)\)/g, (_, inner) => `e^{${inner.replace(/\*/g, '').trim()}}`);
    s = s.replace(/log\(abs\(([^)]+)\)\)/g, (_, x) => `\\ln|${x}|`);
    s = s.replace(/\*/g, ' \\cdot ');
    // expr/num + C → \frac{expr}{num} + C
    const fracMatch = s.match(/^(.+)\/(\d+)\s*\+\s*C$/);
    if (fracMatch) {
      return `\\frac{${fracMatch[1].trim()}}{${fracMatch[2]}} + C`;
    }
    return s.replace(/\//g, ' \\div ');
  }
}

