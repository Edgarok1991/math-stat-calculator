import { Injectable } from '@nestjs/common';
import { MatrixDto } from './dto/matrix.dto';
import { GaussResult, GaussStep } from './interfaces/gauss-result.interface';

@Injectable()
export class MatricesService {
  // Функция для генерации понятных описаний операций со строками
  private getOperationDescription(operation: 'subtract' | 'add' | 'multiply' | 'divide', 
                                 targetRow: number, sourceRow: number, factor: number): string {
    const factorStr = this.toFraction(factor);
    
    switch (operation) {
      case 'subtract':
        return `от ${targetRow} строки отнимаем ${sourceRow} строку, умноженную на ${factorStr}`;
      case 'add':
        return `к ${targetRow} строке прибавляем ${sourceRow} строку, умноженную на ${factorStr}`;
      case 'multiply':
        return `умножаем ${targetRow} строку на ${factorStr}`;
      case 'divide':
        return `делим ${targetRow} строку на ${factorStr}`;
      default:
        return `операция со строками ${targetRow} и ${sourceRow}`;
    }
  }

  // Функция для преобразования в дробь
  private toFraction(num: number): string {
    // Мгновенная защита от нечисловых значений
    if (Number.isNaN(num)) return 'неопределено';
    if (!isFinite(num)) return num.toString();
    if (Number.isInteger(num)) return num.toString();
    
    // Сначала пробуем найти точную дробь с помощью алгоритма непрерывных дробей
    const tolerance = 1e-10; // Более строгая точность
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = num;
    let iterations = 0;
    const maxIterations = 200; // Увеличиваем количество итераций
    
    do {
      let a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
      const diff = b - a;
      // Защита от деления на ноль/почти ноль
      if (Math.abs(diff) < 1e-12) {
        return this.forceFraction(num);
      }
      b = 1 / diff;
      iterations++;
      if (iterations > maxIterations) {
        // Если алгоритм непрерывных дробей не сработал, пробуем другой подход
        return this.forceFraction(num);
      }
      // Если знаменатель вышел за безопасные пределы или стал нечисловым
      if (!isFinite(k1) || !isFinite(h1)) {
        return this.forceFraction(num);
      }
    } while (Math.abs(num - h1 / k1) > Math.abs(num) * tolerance);
    
    const gcd = (a: number, b: number, depth: number = 0): number => {
      // Защита от бесконечной рекурсии
      if (depth > 100) {
        return 1;
      }
      
      if (b === 0) return a;
      if (a === 0) return b;
      if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) return 1;
      
      // Округляем до целых чисел для избежания проблем с плавающей точкой
      const intA = Math.round(a);
      const intB = Math.round(b);
      
      // Если числа очень маленькие, возвращаем 1
      if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) {
        return 1;
      }
      
      return gcd(intB, intA % intB, depth + 1);
    };
    
    const divisor = gcd(Math.abs(h1), Math.abs(k1));
    const simplifiedNum = h1 / divisor;
    const simplifiedDen = k1 / divisor;
    
    if (!isFinite(simplifiedNum) || !isFinite(simplifiedDen) || simplifiedDen === 0) {
      return this.forceFraction(num);
    }
    if (simplifiedDen === 1) return simplifiedNum.toString();
    if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
    return `${simplifiedNum}/${simplifiedDen}`;
  }

  // Принудительное преобразование в дробь
  private forceFraction(num: number): string {
    // Пробуем найти дробь с разными знаменателями
    const denominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
                          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                          41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
                          61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
                          81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
                          101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
                          121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
                          141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160,
                          161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180,
                          181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200];
    
    for (const den of denominators) {
      const numerator = Math.round(num * den);
      const error = Math.abs(num - numerator / den);
      if (error < 1e-10) {
        const gcd = this.gcd(Math.abs(numerator), den);
        const simplifiedNum = numerator / gcd;
        const simplifiedDen = den / gcd;
        
        if (simplifiedDen === 1) return simplifiedNum.toString();
        if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
        return `${simplifiedNum}/${simplifiedDen}`;
      }
    }
    
    // Если ничего не найдено, используем более точный подход
    const precision = 1e-12;
    const denominator = Math.round(1 / precision);
    const numerator = Math.round(num * denominator);
    const gcd = this.gcd(Math.abs(numerator), denominator);
    const simplifiedNum = numerator / gcd;
    const simplifiedDen = denominator / gcd;
    
    if (simplifiedDen === 1) return simplifiedNum.toString();
    if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
    return `${simplifiedNum}/${simplifiedDen}`;
  }

  // Вспомогательная функция для НОД
  private gcd(a: number, b: number): number {
    if (b === 0) return a;
    if (a === 0) return b;
    if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) return 1;
    
    const intA = Math.round(a);
    const intB = Math.round(b);
    
    if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) {
      return 1;
    }
    
    return this.gcd(intB, intA % intB);
  }

  // Функция для преобразования матрицы в дроби для отображения
  private matrixToFractions(matrix: number[][]): string[][] {
    return matrix.map(row => 
      row.map(cell => this.toFraction(cell))
    );
  }
  solveGauss(data: MatrixDto): GaussResult {
    const { matrix, vector } = data;
    
    if (!vector || vector.length !== matrix.length) {
      throw new Error('Вектор должен иметь ту же длину, что и количество строк матрицы');
    }

    const n = matrix.length;
    const m = matrix[0].length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);
    const steps: string[] = [];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    
    // Исходная матрица
    steps.push(`Исходная расширенная матрица: [${augmented.map(row => `[${row.map(coeff => this.toFraction(coeff)).join(', ')}]`).join(', ')}]`);
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная расширенная матрица системы:\n\n` +
        `Система уравнений:\n${augmented.map((row, i) => {
          const equationParts = row.slice(0, -1).map((coeff, idx) => {
            if (coeff === 0) return '';
            const coeffFraction = this.toFraction(coeff);
            const sign = coeff > 0 && idx > 0 ? '+' : '';
            return `${sign}${coeffFraction}x${idx + 1}`;
          }).filter(x => x);
          return `Уравнение ${i + 1}: ${equationParts.join(' ')} = ${this.toFraction(row[row.length - 1])}`;
        }).join('\n')}\n\n` +
        `Расширенная матрица:\n${augmented.map((row, i) => `Строка ${i + 1}: [${row.slice(0, -1).map(coeff => this.toFraction(coeff)).join(', ')}] | ${this.toFraction(row[row.length - 1])}`).join('\n')}\n\n` +
        `Где последний столбец - это правая часть уравнений.`,
      matrix: this.matrixToFractions(augmented),
      operation: 'swap'
    });

    const eps = 1e-10;
    
    // Прямой ход метода Гаусса - приводим к ступенчатому виду
    let currentRow = 0;
    
    for (let col = 0; col < m && currentRow < n; col++) {
      // Проверяем, что опорный элемент не равен нулю
      if (Math.abs(augmented[currentRow][col]) < eps) {
        continue;
      }
      
      // Сначала проверяем, есть ли ниже строка, где на позиции col стоит 1 или -1
      let rowWithOne = -1;
      let rowWithMinusOne = -1;
      
      for (let row = currentRow; row < n; row++) {
        if (Math.abs(augmented[row][col] - 1) < eps) {
          rowWithOne = row;
          break;
        } else if (Math.abs(augmented[row][col] + 1) < eps && rowWithMinusOne === -1) {
          rowWithMinusOne = row;
        }
      }
      
      // Если нашли строку с единицей, меняем местами
      if (rowWithOne !== -1 && rowWithOne !== currentRow) {
        [augmented[currentRow], augmented[rowWithOne]] = [augmented[rowWithOne], augmented[currentRow]];
        steps.push(`Шаг ${stepCounter}: Обмен строк ${currentRow + 1} и ${rowWithOne + 1}`);
        detailedSteps.push({
          step: stepCounter++,
          description: `Обмен строк ${currentRow + 1} и ${rowWithOne + 1}:\n\n` +
            `В строке ${rowWithOne + 1} на позиции (${rowWithOne + 1},${col + 1}) стоит единица.\n` +
            `Меняем строки местами, чтобы не делать лишних вычислений.`,
          matrix: this.matrixToFractions(augmented),
          operation: 'swap',
          pivot: { row: currentRow, col: col },
          targetRow: currentRow,
          sourceRow: rowWithOne
        });
      } 
      // Если нашли строку с -1, меняем местами и умножаем на -1
      else if (rowWithMinusOne !== -1 && rowWithMinusOne !== currentRow) {
        [augmented[currentRow], augmented[rowWithMinusOne]] = [augmented[rowWithMinusOne], augmented[currentRow]];
        steps.push(`Шаг ${stepCounter}: Обмен строк ${currentRow + 1} и ${rowWithMinusOne + 1}`);
        detailedSteps.push({
          step: stepCounter++,
          description: `Обмен строк ${currentRow + 1} и ${rowWithMinusOne + 1}:\n\n` +
            `В строке ${rowWithMinusOne + 1} на позиции (${rowWithMinusOne + 1},${col + 1}) стоит -1.\n` +
            `Меняем строки местами для упрощения вычислений.`,
          matrix: this.matrixToFractions(augmented),
          operation: 'swap',
          pivot: { row: currentRow, col: col },
          targetRow: currentRow,
          sourceRow: rowWithMinusOne
        });
        
        // Умножаем строку на -1, чтобы получить единицу
        for (let j = 0; j <= m; j++) {
          augmented[currentRow][j] *= -1;
        }
        
        steps.push(`Шаг ${stepCounter}: ${this.getOperationDescription('multiply', currentRow + 1, 0, -1)}`);
        detailedSteps.push({
          step: stepCounter++,
          description: `Умножение строки ${currentRow + 1} на -1:\n\n` +
            `Элемент a[${currentRow + 1}][${col + 1}] = -1, умножаем строку на -1\n\n` +
            `Результат: элемент в позиции (${currentRow + 1},${col + 1}) стал равен 1`,
          matrix: this.matrixToFractions(augmented),
          operation: 'normalize',
          pivot: { row: currentRow, col: col }
        });
      } 
      // Если на текущей позиции стоит -1, просто умножаем строку на -1
      else if (Math.abs(augmented[currentRow][col] + 1) < eps) {
        for (let j = 0; j <= m; j++) {
          augmented[currentRow][j] *= -1;
        }
        
        steps.push(`Шаг ${stepCounter}: ${this.getOperationDescription('multiply', currentRow + 1, 0, -1)}`);
        detailedSteps.push({
          step: stepCounter++,
          description: `Умножение строки ${currentRow + 1} на -1:\n\n` +
            `Элемент a[${currentRow + 1}][${col + 1}] = -1, умножаем строку на -1\n\n` +
            `Результат: элемент в позиции (${currentRow + 1},${col + 1}) стал равен 1`,
          matrix: this.matrixToFractions(augmented),
          operation: 'normalize',
          pivot: { row: currentRow, col: col }
        });
      }
      // Если единицы или -1 нет, нормализуем текущую строку (делим на опорный элемент)
      else if (Math.abs(augmented[currentRow][col] - 1) >= eps) {
        const pivotElement = augmented[currentRow][col];
        for (let j = 0; j <= m; j++) {
          augmented[currentRow][j] /= pivotElement;
        }
        
        steps.push(`Шаг ${stepCounter}: ${this.getOperationDescription('divide', currentRow + 1, 0, pivotElement)}`);
        detailedSteps.push({
          step: stepCounter++,
          description: `Нормализация строки ${currentRow + 1}:\n\n` +
            `Делим строку ${currentRow + 1} на элемент a[${currentRow + 1}][${col + 1}] = ${this.toFraction(pivotElement)}\n\n` +
            `Результат: элемент в позиции (${currentRow + 1},${col + 1}) стал равен 1`,
          matrix: this.matrixToFractions(augmented),
          operation: 'normalize',
          pivot: { row: currentRow, col: col }
        });
      }
      
      // Обнуляем все элементы в столбце (и выше, и ниже опорного)
      for (let row = 0; row < n; row++) {
        if (row !== currentRow && Math.abs(augmented[row][col]) > eps) {
          const factor = augmented[row][col];
          
          for (let j = 0; j <= m; j++) {
            augmented[row][j] -= factor * augmented[currentRow][j];
          }
          
          steps.push(`Шаг ${stepCounter}: ${this.getOperationDescription('subtract', row + 1, currentRow + 1, factor)}`);
          detailedSteps.push({
            step: stepCounter++,
            description: `Обнуление элемента (${row + 1},${col + 1}):\n\n` +
              `Цель: обнулить элемент в позиции (${row + 1},${col + 1})\n\n` +
              `Операция: ${this.getOperationDescription('subtract', row + 1, currentRow + 1, factor)}\n\n` +
              `Результат: элемент в позиции (${row + 1},${col + 1}) стал равен 0`,
            matrix: this.matrixToFractions(augmented),
            operation: 'eliminate',
            pivot: { row: currentRow, col: col },
            factor: factor,
            targetRow: row,
            sourceRow: currentRow
          });
        }
      }
      
      currentRow++;
    }
    
    // Проверяем на противоречия (несовместная система - нет решений)
    for (let row = currentRow; row < n; row++) {
      // Проверяем, есть ли строка вида [0, 0, ..., 0 | b], где b != 0
      const allZeros = augmented[row].slice(0, m).every(val => Math.abs(val) < eps);
      const rightSideNonZero = Math.abs(augmented[row][m]) > eps;
      
      if (allZeros && rightSideNonZero) {
        // Несовместная система - нет решений
        steps.push(`\nСистема несовместна: противоречие в строке ${row + 1}`);
        steps.push(`Получена строка: [${augmented[row].slice(0, m).map(v => this.toFraction(v)).join(', ')}] = ${this.toFraction(augmented[row][m])}`);
        steps.push(`Это эквивалентно уравнению 0 = ${this.toFraction(augmented[row][m])}, что невозможно.`);
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Система не имеет решений:\n\n` +
            `В строке ${row + 1} получено противоречие:\n` +
            `${augmented[row].slice(0, m).map(v => this.toFraction(v)).join(' + ')} = ${this.toFraction(augmented[row][m])}\n\n` +
            `Это означает 0 = ${this.toFraction(augmented[row][m])}, что невозможно.\n\n` +
            `Вывод: Система уравнений несовместна и не имеет решений.`,
          matrix: this.matrixToFractions(augmented),
          operation: 'solution'
        });
        
        const determinant = this.calculateDeterminant({ matrix });
        
        return {
          solution: [],
          steps,
          detailedSteps,
          determinant: {
            determinant: this.toFraction(determinant.determinant),
            rank: determinant.rank,
          },
          rank: currentRow,
          solutionType: 'none',
          message: 'Система не имеет решений (несовместна)'
        };
      }
    }
    
    // Определяем количество главных переменных
    const rank = currentRow;
    
    // Если ранг меньше числа переменных - бесконечное множество решений
    if (rank < m) {
      steps.push(`\nСистема имеет бесконечное множество решений`);
      steps.push(`Ранг матрицы: ${rank}`);
      steps.push(`Количество переменных: ${m}`);
      steps.push(`Количество свободных переменных: ${m - rank}`);
      
      // Определяем свободные переменные
      const freeVars: number[] = [];
      const pivotCols: number[] = [];
      
      for (let row = 0; row < rank; row++) {
        for (let col = 0; col < m; col++) {
          if (Math.abs(augmented[row][col]) > eps && !pivotCols.includes(col)) {
            pivotCols.push(col);
            break;
          }
        }
      }
      
      for (let col = 0; col < m; col++) {
        if (!pivotCols.includes(col)) {
          freeVars.push(col);
        }
      }
      
      // Формируем общее решение
      const solutionDescription: string[] = [];
      for (let col = 0; col < m; col++) {
        if (pivotCols.includes(col)) {
          const rowIndex = pivotCols.indexOf(col);
          let expr = `x${col + 1} = ${this.toFraction(augmented[rowIndex][m])}`;
          
          for (const freeVar of freeVars) {
            const coeff = -augmented[rowIndex][freeVar];
            if (Math.abs(coeff) > eps) {
              if (coeff > 0) {
                expr += ` + ${this.toFraction(coeff)}·t${freeVars.indexOf(freeVar) + 1}`;
              } else {
                expr += ` - ${this.toFraction(Math.abs(coeff))}·t${freeVars.indexOf(freeVar) + 1}`;
              }
            }
          }
          solutionDescription.push(expr);
        } else {
          const tIndex = freeVars.indexOf(col);
          solutionDescription.push(`x${col + 1} = t${tIndex + 1} (свободная переменная)`);
        }
      }
      
      steps.push(`\nОбщее решение:`);
      solutionDescription.forEach(desc => steps.push(desc));
      
      detailedSteps.push({
        step: stepCounter++,
        description: `Система имеет бесконечное множество решений:\n\n` +
          `Ранг матрицы (${rank}) < количество переменных (${m})\n\n` +
          `Общее решение:\n${solutionDescription.join('\n')}\n\n` +
          `где t1, t2, ... — произвольные параметры (свободные переменные)`,
        matrix: this.matrixToFractions(augmented),
        operation: 'solution'
      });
      
      const determinant = this.calculateDeterminant({ matrix });
      
      return {
        solution: solutionDescription,
        steps,
        detailedSteps,
        determinant: {
          determinant: this.toFraction(determinant.determinant),
          rank: determinant.rank,
        },
        rank: rank,
        solutionType: 'infinite',
        message: 'Система имеет бесконечное множество решений'
      };
    }
    
    // Извлекаем решение из правого столбца
    const solution = new Array(m);
    for (let i = 0; i < m; i++) {
      solution[i] = augmented[i][m];
    }
    
    // Преобразуем решение в дроби
    const solutionFractions = solution.map(x => this.toFraction(x));
    
    // Добавляем финальный шаг с результатом
    steps.push(`\nРешение найдено: [${solutionFractions.join(', ')}]`);
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Решение системы:\n\n` +
        `После приведения матрицы к единичному виду получаем:\n\n` +
        `Единичная матрица с решением в правом столбце:\n` +
        `${augmented.map((row, i) => 
          `Строка ${i + 1}: [${row.slice(0, -1).map(coeff => this.toFraction(coeff)).join(', ')}] | ${this.toFraction(row[row.length - 1])}`
        ).join('\n')}\n\n` +
        `Решение системы:\n` +
        `${solutionFractions.map((val, i) => `x${i + 1} = ${val}`).join('\n')}\n\n` +
        `Проверка: подставляем найденные значения в исходные уравнения для проверки правильности решения.`,
      matrix: this.matrixToFractions(augmented),
      operation: 'solution',
      pivot: { row: 0, col: 0 }
    });

    const determinant = this.calculateDeterminant({ matrix });

    return {
      solution: solutionFractions,
      steps,
      detailedSteps,
      determinant: {
        determinant: this.toFraction(determinant.determinant),
        rank: determinant.rank,
      },
      rank: rank,
      solutionType: 'unique',
      message: 'Система имеет единственное решение'
    };
  }

  calculateInverse(data: MatrixDto): any {
    const { matrix } = data;
    
    if (matrix.length !== matrix[0].length) {
      throw new Error('Матрица должна быть квадратной');
    }

    const n = matrix.length;
    const identity = Array(n).fill(null).map((_, i) => 
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );

    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
    const steps: string[] = [];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    steps.push(`═══ ВЫЧИСЛЕНИЕ ОБРАТНОЙ МАТРИЦЫ ═══`);
    steps.push(``);
    steps.push(`Метод Гаусса-Жордана: приводим расширенную матрицу [A|E] к виду [E|A^(-1)]`);
    
    // Исходная расширенная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная расширенная матрица [A|E]:\n\n` +
        `• Левая часть: исходная матрица A размером ${n}×${n}\n` +
        `• Правая часть: единичная матрица E размером ${n}×${n}\n` +
        `• Общий размер: ${n}×${2*n}\n\n` +
        `Цель: привести левую часть к единичной матрице E,\n` +
        `при этом правая часть станет обратной матрицей A^(-1)`,
      matrix: this.matrixToFractions(augmented),
      operation: 'swap'
    });

    const eps = 1e-12;

    // Прямой ход - для каждого столбца
    for (let i = 0; i < n; i++) {
      if (Math.abs(augmented[i][i]) < eps) {
        throw new Error('Матрица вырождена (определитель = 0), обратная матрица не существует');
      }
      
      // Нормализация диагонального элемента
      const diagonalElement = augmented[i][i];
      if (Math.abs(diagonalElement - 1) > eps) {
        for (let j = 0; j < 2 * n; j++) {
          augmented[i][j] /= diagonalElement;
        }
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Нормализация элемента [${i+1},${i+1}] → 1:\n\n` +
            `• Диагональный элемент: a[${i+1},${i+1}] = ${this.toFraction(diagonalElement)}\n` +
            `• Операция: делим строку ${i+1} на ${this.toFraction(diagonalElement)}\n` +
            `• Результат: элемент [${i+1},${i+1}] стал равен 1`,
          matrix: this.matrixToFractions(augmented),
          operation: 'normalize',
          pivot: { row: i, col: i }
        });
      }

      // Обнуление остальных элементов в столбце i
      for (let k = 0; k < n; k++) {
        if (k !== i && Math.abs(augmented[k][i]) > eps) {
          const factor = augmented[k][i];
          
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
          
          detailedSteps.push({
            step: stepCounter++,
            description: `Обнуление элемента [${k+1},${i+1}]:\n\n` +
              `• Цель: обнулить элемент в позиции [${k+1},${i+1}]\n` +
              `• Текущий элемент: a[${k+1},${i+1}] = ${this.toFraction(factor)}\n` +
              `• Опорный элемент: a[${i+1},${i+1}] = 1\n\n` +
              `Операция: от строки ${k+1} вычитаем строку ${i+1}, умноженную на ${this.toFraction(factor)}\n\n` +
              `Результат: элемент [${k+1},${i+1}] стал равен 0`,
            matrix: this.matrixToFractions(augmented),
            operation: 'eliminate',
            pivot: { row: i, col: i },
            factor: factor,
            targetRow: k,
            sourceRow: i
          });
        }
      }
    }

    const inverse = augmented.map(row => row.slice(n));
    
    // Финальный шаг
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат вычисления обратной матрицы:\n\n` +
        `• Левая часть: единичная матрица E\n` +
        `• Правая часть: обратная матрица A^(-1)\n\n` +
        `Проверка: A · A^(-1) = E\n\n` +
        `Обратная матрица A^(-1) размером ${n}×${n} успешно найдена!`,
      matrix: this.matrixToFractions(augmented),
      operation: 'solution'
    });

    return {
      inverse,
      determinant: this.calculateDeterminant({ matrix }),
      steps,
      detailedSteps,
    };
  }

  calculateDeterminant(data: { matrix: number[][], method?: string, laplaceType?: string, laplaceIndex?: number }): any {
    const { matrix, method = 'laplace', laplaceType = 'row', laplaceIndex = 0 } = data;
    
    if (matrix.length !== matrix[0].length) {
      throw new Error('Матрица должна быть квадратной');
    }

    const n = matrix.length;
    let result: { determinant: number; steps: string[]; detailedSteps: GaussStep[] };

    // Выбираем метод вычисления
    switch (method) {
      case 'laplace':
        result = this.calculateDeterminantByLaplace(matrix, laplaceType, laplaceIndex);
        break;
      case 'sarrus':
        if (n !== 3) {
          throw new Error('Правило Саррюса применимо только для матриц 3×3');
        }
        result = this.calculateDeterminantBySarrus(matrix);
        break;
      case 'triangle':
        result = this.calculateDeterminantByTriangle(matrix);
        break;
      default:
        const det = this.calculateDeterminantRecursive(matrix);
        result = {
          determinant: det,
          steps: [`Определитель = ${this.toFraction(det)}`],
          detailedSteps: []
        };
    }
    
    return {
      determinant: result.determinant,
      rank: this.calculateRank(matrix),
      steps: result.steps,
      detailedSteps: result.detailedSteps,
    };
  }

  multiplyByVector(data: MatrixDto): any {
    const { matrix, vector } = data;
    
    if (!vector) {
      throw new Error('Вектор не предоставлен');
    }

    if (matrix[0].length !== vector.length) {
      throw new Error('Количество столбцов матрицы должно совпадать с длиной вектора');
    }

    const solution = matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );

    const steps = [
      `Умножение матрицы ${matrix.length}x${matrix[0].length} на вектор длины ${vector.length}`,
      `Результат: вектор длины ${solution.length}`,
      `Формула: result[i] = Σ(matrix[i][j] * vector[j]) для j от 0 до ${vector.length-1}`
    ];

    return {
      solution,
      steps,
      determinant: this.calculateDeterminant({ matrix }),
      rank: this.calculateRank(matrix),
    };
  }

  private calculateDeterminantRecursive(matrix: number[][]): number {
    const n = matrix.length;
    
    if (n === 1) {
      return matrix[0][0];
    }
    
    if (n === 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }
    
    let determinant = 0;
    for (let i = 0; i < n; i++) {
      const submatrix = matrix.slice(1).map(row => row.filter((_, j) => j !== i));
      determinant += matrix[0][i] * Math.pow(-1, i) * this.calculateDeterminantRecursive(submatrix);
    }
    
    return determinant;
  }

  // Метод 1: Разложение определителя по строке или столбцу (метод Лапласа)
  private calculateDeterminantByLaplace(matrix: number[][], type: string = 'row', index: number = 0): { determinant: number; steps: string[]; detailedSteps: GaussStep[] } {
    const n = matrix.length;
    const steps: string[] = [];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;

    const isRow = type === 'row';
    const lineNumber = index + 1;
    const lineType = isRow ? 'строке' : 'столбцу';

    steps.push('═══ РАЗЛОЖЕНИЕ ОПРЕДЕЛИТЕЛЯ ПО ЭЛЕМЕНТАМ СТРОКИ ИЛИ СТОЛБЦА ═══');
    steps.push('');
    steps.push(`Метод: Разложение определителя по ${lineNumber}-й ${lineType}`);
    steps.push('');

    // Исходная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица размером ${n}×${n}:\n\nБудем раскладывать определитель по ${lineNumber}-й ${lineType}`,
      matrix: this.matrixToFractions(matrix),
      operation: 'swap',
      pivot: isRow ? { row: index, col: 0 } : { row: 0, col: index }
    });

    if (n === 1) {
      const det = matrix[0][0];
      steps.push(`Матрица 1×1, определитель = ${this.toFraction(det)}`);
      detailedSteps.push({
        step: stepCounter++,
        description: `Результат:\n\nОпределитель = ${this.toFraction(det)}`,
        matrix: this.matrixToFractions(matrix),
        operation: 'solution'
      });
      return { determinant: det, steps, detailedSteps };
    }

    if (n === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      steps.push(`Для матрицы 2×2 используем формулу:`);
      steps.push(`det = a₁₁ · a₂₂ - a₁₂ · a₂₁`);
      steps.push('');
      steps.push(`det = ${this.toFraction(matrix[0][0])} · ${this.toFraction(matrix[1][1])} - ${this.toFraction(matrix[0][1])} · ${this.toFraction(matrix[1][0])}`);
      steps.push(`det = ${this.toFraction(matrix[0][0] * matrix[1][1])} - ${this.toFraction(matrix[0][1] * matrix[1][0])}`);
      steps.push(`det = ${this.toFraction(det)}`);
      
      detailedSteps.push({
        step: stepCounter++,
        description: `Формула для матрицы 2×2:\n\ndet = a₁₁ · a₂₂ - a₁₂ · a₂₁\n\ndet = ${this.toFraction(det)}`,
        matrix: this.matrixToFractions(matrix),
        operation: 'solution'
      });
      
      return { determinant: det, steps, detailedSteps };
    }

    // Теоретическая часть
    steps.push(`📖 ТЕОРИЯ:`);
    steps.push('');
    if (isRow) {
      steps.push(`Формула разложения по ${lineNumber}-й строке:`);
      steps.push(`det(A) = a_${lineNumber}1·A_${lineNumber}1 + a_${lineNumber}2·A_${lineNumber}2 + ... + a_${lineNumber}${n}·A_${lineNumber}${n}`);
    } else {
      steps.push(`Формула разложения по ${lineNumber}-му столбцу:`);
      steps.push(`det(A) = a_1${lineNumber}·A_1${lineNumber} + a_2${lineNumber}·A_2${lineNumber} + ... + a_${n}${lineNumber}·A_${n}${lineNumber}`);
    }
    steps.push('');
    steps.push('где A_ij - алгебраическое дополнение элемента a_ij');
    steps.push('A_ij = (-1)^(i+j) · M_ij');
    steps.push('M_ij - минор элемента a_ij (определитель матрицы без i-й строки и j-го столбца)');
    steps.push('');
    steps.push('─'.repeat(60));
    steps.push('');
    steps.push(`🔢 ВЫЧИСЛЕНИЕ:`);
    steps.push('');
    
    let determinant = 0;
    const terms: string[] = [];
    const termDetails: string[] = [];

    for (let k = 0; k < n; k++) {
      const i = isRow ? index : k;
      const j = isRow ? k : index;
      const element = matrix[i][j];
      
      // Знак алгебраического дополнения
      const sign = Math.pow(-1, i + j);
      const signStr = sign > 0 ? '+' : '-';
      
      // Создаём минор (убираем i-ю строку и j-й столбец)
      const minor = matrix
        .filter((_, rowIndex) => rowIndex !== i)
        .map(row => row.filter((_, colIndex) => colIndex !== j));
      
      // Визуализация минора
      detailedSteps.push({
        step: stepCounter++,
        description: `Шаг ${k + 1}. Элемент a_${i+1},${j+1} = ${this.toFraction(element)}\n\nМинор M_${i+1},${j+1} получаем, вычеркивая ${i+1}-ю строку и ${j+1}-й столбец:`,
        matrix: this.matrixToFractions(minor),
        operation: 'eliminate',
        pivot: { row: i, col: j }
      });
      
      const minorDet = this.calculateDeterminantRecursive(minor);
      const cofactor = sign * minorDet;
      const term = element * cofactor;
      
      determinant += term;
      
      // Подробное объяснение для каждого элемента
      steps.push(`Шаг ${k + 1}:`);
      steps.push(`• Элемент: a_${i+1},${j+1} = ${this.toFraction(element)}`);
      steps.push(`• Позиция: (${i+1}, ${j+1}), сумма индексов = ${i+1}+${j+1} = ${i+j+2}`);
      steps.push(`• Знак: (-1)^${i+j+2} = ${signStr}1`);
      steps.push(`• Минор M_${i+1},${j+1} = ${this.toFraction(minorDet)}`);
      steps.push(`• Алгебраическое дополнение: A_${i+1},${j+1} = (${signStr}1) · ${this.toFraction(minorDet)} = ${this.toFraction(cofactor)}`);
      steps.push(`• Вклад в определитель: ${this.toFraction(element)} · ${this.toFraction(cofactor)} = ${this.toFraction(term)}`);
      steps.push('');
      
      // Для итоговой формулы
      const termStr = term >= 0 ? this.toFraction(term) : this.toFraction(term);
      terms.push(termStr);
      termDetails.push(`${this.toFraction(element)} · ${this.toFraction(cofactor)}`);
    }

    steps.push('─'.repeat(60));
    steps.push('');
    steps.push(`📊 ИТОГОВОЕ ВЫЧИСЛЕНИЕ:`);
    steps.push('');
    steps.push(`det(A) = ${termDetails.join(' + ').replace(/\+ -/g, '- ')}`);
    steps.push(`det(A) = ${terms.join(' + ').replace(/\+ -/g, '- ')}`);
    steps.push(`det(A) = ${this.toFraction(determinant)}`);

    detailedSteps.push({
      step: stepCounter++,
      description: `✅ РЕЗУЛЬТАТ:\n\nОпределитель равен сумме всех вкладов:\n\ndet(A) = ${terms.join(' + ').replace(/\+ -/g, '- ')}\n\ndet(A) = ${this.toFraction(determinant)}`,
      matrix: this.matrixToFractions(matrix),
      operation: 'solution'
    });

    return { determinant, steps, detailedSteps };
  }

  // Метод 2: Правило Саррюса (только для матриц 3×3)
  private calculateDeterminantBySarrus(matrix: number[][]): { determinant: number; steps: string[]; detailedSteps: GaussStep[] } {
    const steps: string[] = [];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;

    steps.push('═══ ВЫЧИСЛЕНИЕ ОПРЕДЕЛИТЕЛЯ ПО ПРАВИЛУ САРРЮСА ═══');
    steps.push('');
    steps.push('Метод: Правило Саррюса (для матриц 3×3)');
    steps.push('');

    // Исходная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица 3×3:\n\nПравило Саррюса: добавляем первые два столбца справа`,
      matrix: this.matrixToFractions(matrix),
      operation: 'swap'
    });

    // Расширенная матрица для визуализации
    const extendedMatrix = matrix.map(row => [...row, row[0], row[1]]);
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Расширенная матрица (для наглядности):\n\nДобавлены первые два столбца справа`,
      matrix: this.matrixToFractions(extendedMatrix),
      operation: 'eliminate'
    });

    // Вычисляем положительные диагонали
    const pos1 = matrix[0][0] * matrix[1][1] * matrix[2][2];
    const pos2 = matrix[0][1] * matrix[1][2] * matrix[2][0];
    const pos3 = matrix[0][2] * matrix[1][0] * matrix[2][1];
    
    steps.push('Положительные диагонали (↘):');
    steps.push(`• Диагональ 1: ${this.toFraction(matrix[0][0])} · ${this.toFraction(matrix[1][1])} · ${this.toFraction(matrix[2][2])} = ${this.toFraction(pos1)}`);
    steps.push(`• Диагональ 2: ${this.toFraction(matrix[0][1])} · ${this.toFraction(matrix[1][2])} · ${this.toFraction(matrix[2][0])} = ${this.toFraction(pos2)}`);
    steps.push(`• Диагональ 3: ${this.toFraction(matrix[0][2])} · ${this.toFraction(matrix[1][0])} · ${this.toFraction(matrix[2][1])} = ${this.toFraction(pos3)}`);
    steps.push('');

    detailedSteps.push({
      step: stepCounter++,
      description: `Положительные диагонали (↘):\n\nДиагональ 1: ${this.toFraction(pos1)}\nДиагональ 2: ${this.toFraction(pos2)}\nДиагональ 3: ${this.toFraction(pos3)}\n\nСумма: ${this.toFraction(pos1 + pos2 + pos3)}`,
      matrix: this.matrixToFractions(matrix),
      operation: 'eliminate'
    });

    // Вычисляем отрицательные диагонали
    const neg1 = matrix[0][2] * matrix[1][1] * matrix[2][0];
    const neg2 = matrix[0][0] * matrix[1][2] * matrix[2][1];
    const neg3 = matrix[0][1] * matrix[1][0] * matrix[2][2];
    
    steps.push('Отрицательные диагонали (↙):');
    steps.push(`• Диагональ 4: ${this.toFraction(matrix[0][2])} · ${this.toFraction(matrix[1][1])} · ${this.toFraction(matrix[2][0])} = ${this.toFraction(neg1)}`);
    steps.push(`• Диагональ 5: ${this.toFraction(matrix[0][0])} · ${this.toFraction(matrix[1][2])} · ${this.toFraction(matrix[2][1])} = ${this.toFraction(neg2)}`);
    steps.push(`• Диагональ 6: ${this.toFraction(matrix[0][1])} · ${this.toFraction(matrix[1][0])} · ${this.toFraction(matrix[2][2])} = ${this.toFraction(neg3)}`);
    steps.push('');

    detailedSteps.push({
      step: stepCounter++,
      description: `Отрицательные диагонали (↙):\n\nДиагональ 4: ${this.toFraction(neg1)}\nДиагональ 5: ${this.toFraction(neg2)}\nДиагональ 6: ${this.toFraction(neg3)}\n\nСумма: ${this.toFraction(neg1 + neg2 + neg3)}`,
      matrix: this.matrixToFractions(matrix),
      operation: 'eliminate'
    });

    const determinant = (pos1 + pos2 + pos3) - (neg1 + neg2 + neg3);
    
    steps.push('Итоговое вычисление:');
    steps.push(`det = (${this.toFraction(pos1)} + ${this.toFraction(pos2)} + ${this.toFraction(pos3)}) - (${this.toFraction(neg1)} + ${this.toFraction(neg2)} + ${this.toFraction(neg3)})`);
    steps.push(`det = ${this.toFraction(pos1 + pos2 + pos3)} - ${this.toFraction(neg1 + neg2 + neg3)}`);
    steps.push(`det = ${this.toFraction(determinant)}`);

    detailedSteps.push({
      step: stepCounter++,
      description: `Результат:\n\ndet = (сумма ↘) - (сумма ↙)\ndet = ${this.toFraction(pos1 + pos2 + pos3)} - ${this.toFraction(neg1 + neg2 + neg3)}\n\ndet = ${this.toFraction(determinant)}`,
      matrix: this.matrixToFractions(matrix),
      operation: 'solution'
    });

    return { determinant, steps, detailedSteps };
  }

  // Метод 3: Правило треугольника (метод Гаусса)
  private calculateDeterminantByTriangle(matrix: number[][]): { determinant: number; steps: string[]; detailedSteps: GaussStep[] } {
    const n = matrix.length;
    const steps: string[] = [];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;

    steps.push('═══ ВЫЧИСЛЕНИЕ ОПРЕДЕЛИТЕЛЯ МЕТОДОМ ТРЕУГОЛЬНИКА ═══');
    steps.push('');
    steps.push('Метод: Приведение к треугольному виду (метод Гаусса)');
    steps.push('');
    steps.push('Свойство: det(A) = произведение диагональных элементов треугольной матрицы');
    steps.push('');

    // Копируем матрицу
    const A = matrix.map(row => [...row]);
    let detMultiplier = 1; // Для учёта перестановок строк

    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица размером ${n}×${n}:\n\nБудем приводить к верхнетреугольному виду`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });

    // Прямой ход метода Гаусса
    for (let i = 0; i < n; i++) {
      // Поиск ненулевого элемента в столбце
      if (Math.abs(A[i][i]) < 1e-10) {
        let swapped = false;
        for (let k = i + 1; k < n; k++) {
          if (Math.abs(A[k][i]) > 1e-10) {
            // Меняем строки местами
            [A[i], A[k]] = [A[k], A[i]];
            detMultiplier *= -1;
            swapped = true;
            
            steps.push(`Меняем строки ${i + 1} ↔ ${k + 1} (знак определителя меняется)`);
            
            detailedSteps.push({
              step: stepCounter++,
              description: `Перестановка строк ${i + 1} ↔ ${k + 1}\n\nПри перестановке строк знак определителя меняется на противоположный`,
              matrix: this.matrixToFractions(A),
              operation: 'swap',
              pivot: { row: i, col: i }
            });
            
            break;
          }
        }
        
        if (!swapped) {
          steps.push(`Столбец ${i + 1} содержит только нули ниже диагонали`);
          steps.push(`Определитель = 0`);
          
          detailedSteps.push({
            step: stepCounter++,
            description: `Результат:\n\nМатрица вырождена (есть нулевой столбец)\n\ndet = 0`,
            matrix: this.matrixToFractions(A),
            operation: 'solution'
          });
          
          return { determinant: 0, steps, detailedSteps };
        }
      }

      // Обнуление элементов под диагональю
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > 1e-10) {
          const factor = A[k][i] / A[i][i];
          
          steps.push(`Строка ${k + 1}: вычитаем строку ${i + 1}, умноженную на ${this.toFraction(factor)}`);
          
          for (let j = i; j < n; j++) {
            A[k][j] -= factor * A[i][j];
          }
          
          detailedSteps.push({
            step: stepCounter++,
            description: `Обнуляем элемент A[${k+1},${i+1}]\n\nСтрока ${k + 1} = Строка ${k + 1} - ${this.toFraction(factor)} · Строка ${i + 1}`,
            matrix: this.matrixToFractions(A),
            operation: 'eliminate',
            pivot: { row: i, col: i },
            factor: factor
          });
        }
      }
    }

    steps.push('');
    steps.push('Матрица приведена к треугольному виду');
    steps.push('');

    // Вычисляем определитель как произведение диагональных элементов
    let determinant = detMultiplier;
    const diagonalElements: string[] = [];
    
    for (let i = 0; i < n; i++) {
      determinant *= A[i][i];
      diagonalElements.push(this.toFraction(A[i][i]));
    }

    steps.push('Определитель = произведение диагональных элементов:');
    steps.push(`det = ${detMultiplier === -1 ? '-1 · ' : ''}${diagonalElements.join(' · ')}`);
    steps.push(`det = ${this.toFraction(determinant)}`);

    detailedSteps.push({
      step: stepCounter++,
      description: `Результат:\n\nТреугольная матрица получена\n\ndet = ${detMultiplier === -1 ? '(-1) · ' : ''}произведение диагональных элементов\ndet = ${this.toFraction(determinant)}`,
      matrix: this.matrixToFractions(A),
      operation: 'solution'
    });

    return { determinant, steps, detailedSteps };
  }

  private calculateRank(matrix: number[][]): number {
    const n = matrix.length;
    const m = matrix[0].length;
    let rank = Math.min(n, m);
    
    for (let i = 0; i < rank; i++) {
      if (matrix[i][i] !== 0) {
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            const factor = matrix[j][i] / matrix[i][i];
            for (let k = 0; k < m; k++) {
              matrix[j][k] -= factor * matrix[i][k];
            }
          }
        }
      } else {
        let reduce = true;
        for (let k = i + 1; k < n; k++) {
          if (matrix[k][i] !== 0) {
            [matrix[i], matrix[k]] = [matrix[k], matrix[i]];
            reduce = false;
            break;
          }
        }
        
        if (reduce) {
          rank--;
          for (let j = 0; j < n; j++) {
            matrix[j][i] = matrix[j][rank];
          }
        }
        i--;
      }
    }
    
    return rank;
  }

  // Новое: умножение двух матриц A(m×n) * B(n×p) с генерацией шагов
  multiplyMatrices(matrixA: number[][], matrixB: number[][]) {
    const m = matrixA.length;
    const nA = matrixA[0]?.length ?? 0;
    const nB = matrixB.length;
    const p = matrixB[0]?.length ?? 0;

    if (m === 0 || nA === 0 || nB === 0 || p === 0) {
      throw new Error('Матрицы не должны быть пустыми');
    }
    if (nA !== nB) {
      throw new Error(`Число столбцов A (${nA}) должно совпадать с числом строк B (${nB})`);
    }
    // Проверка прямоугольности
    if (!matrixA.every(row => row.length === nA) || !matrixB.every(row => row.length === p)) {
      throw new Error('Все строки матриц должны иметь одинаковую длину');
    }

    const result: number[][] = Array.from({ length: m }, () => Array(p).fill(0));
    const steps: string[] = [];

    steps.push(`═══ УМНОЖЕНИЕ МАТРИЦ ═══`);
    steps.push(``);
    steps.push(`Шаг 1. Проверка размеров:`);
    steps.push(`  • Матрица A имеет размер ${m}×${nA}`);
    steps.push(`  • Матрица B имеет размер ${nB}×${p}`);
    steps.push(`  • Число столбцов A (${nA}) = число строк B (${nB}) ✓ — умножение возможно`);
    steps.push(``);
    steps.push(`Шаг 2. Размер результата:`);
    steps.push(`  • Матрица C = A × B будет иметь размер ${m}×${p}`);
    steps.push(``);
    steps.push(`Шаг 3. Формула умножения:`);
    steps.push(`  • Элемент c[i,j] = сумма произведений элементов i-й строки A на j-й столбец B`);
    steps.push(`  • c[i,j] = a[i,1]·b[1,j] + a[i,2]·b[2,j] + ... + a[i,${nA}]·b[${nA},j]`);
    steps.push(``);
    steps.push(`Шаг 4. Вычисляем каждый элемент матрицы C:`);

    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходные матрицы
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${m}×${nA}\n` +
        `Матрица A участвует в умножении слева`,
      matrix: this.matrixToFractions(matrixA),
      operation: 'swap'
    });
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица B:\n\n` +
        `Размер: ${nB}×${p}\n` +
        `Матрица B участвует в умножении справа`,
      matrix: this.matrixToFractions(matrixB),
      operation: 'swap'
    });
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        const terms: string[] = [];
        for (let k = 0; k < nA; k++) {
          const term = matrixA[i][k] * matrixB[k][j];
          sum += term;
          terms.push(`${this.toFraction(matrixA[i][k])}·${this.toFraction(matrixB[k][j])}`);
        }
        result[i][j] = sum;
        
        const partialC = Array.from({ length: m }, (_, pi) =>
          Array.from({ length: p }, (__, pj) => {
            if (pi < i || (pi === i && pj <= j)) {
              return result[pi][pj];
            }
            return 0;
          })
        );
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Вычисление элемента C[${i+1},${j+1}]:\n\n` +
            `Формула: c[${i+1},${j+1}] = сумма(a[${i+1},k] · b[k,${j+1}]) для k от 1 до ${nA}\n\n` +
            `Подробно:\n` +
            terms.map((t, idx) => `  • k=${idx+1}: ${t}`).join('\n') + `\n\n` +
            `Результат: C[${i+1},${j+1}] = ${terms.join(' + ')} = ${this.toFraction(sum)}`,
          matrix: this.matrixToFractions(partialC),
          operation: 'eliminate',
          pivot: { row: i, col: j }
        });
      }
    }
    
    // Финальная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат умножения:\n\n` +
        `Матрица C = A × B размером ${m}×${p}\n` +
        `Все элементы вычислены`,
      matrix: this.matrixToFractions(result),
      operation: 'solution'
    });
    
    steps.push(``);
    steps.push(`Результат: матрица C размером ${m}×${p} получена`);

    return {
      result,
      steps,
      detailedSteps,
    };
  }

  addMatrices(A: number[][], B: number[][]) {
    if (A.length !== B.length || A[0].length !== B[0].length) {
      throw new Error('Сложение возможно только для матриц одинакового размера');
    }
    const m = A.length, n = A[0].length;
    const C = Array.from({ length: m }, (_, i) =>
      Array.from({ length: n }, (_, j) => A[i][j] + B[i][j])
    );
    const steps: string[] = [
      `═══ СЛОЖЕНИЕ МАТРИЦ ═══`,
      ``,
      `Формула: C = A + B, где c[i,j] = a[i,j] + b[i,j]`,
    ];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходные матрицы A и B
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${m}×${n}\n` +
        `Элементы матрицы A, которые будут участвовать в сложении`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица B:\n\n` +
        `Размер: ${m}×${n}\n` +
        `Элементы матрицы B, которые будут прибавляться к A`,
      matrix: this.matrixToFractions(B),
      operation: 'swap'
    });
    
    // Вычисление каждого элемента с промежуточными результатами
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const partialC = Array.from({ length: m }, (_, pi) =>
          Array.from({ length: n }, (__, pj) => {
            if (pi < i || (pi === i && pj <= j)) {
              return A[pi][pj] + B[pi][pj];
            }
            return 0;
          })
        );
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Вычисление элемента C[${i+1},${j+1}]:\n\n` +
            `• A[${i+1},${j+1}] = ${this.toFraction(A[i][j])}\n` +
            `• B[${i+1},${j+1}] = ${this.toFraction(B[i][j])}\n` +
            `• C[${i+1},${j+1}] = ${this.toFraction(A[i][j])} + ${this.toFraction(B[i][j])} = ${this.toFraction(C[i][j])}`,
          matrix: this.matrixToFractions(partialC),
          operation: 'eliminate',
          pivot: { row: i, col: j }
        });
      }
    }
    
    // Финальная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат сложения:\n\n` +
        `Матрица C = A + B размером ${m}×${n}\n` +
        `Все элементы вычислены по формуле c[i,j] = a[i,j] + b[i,j]`,
      matrix: this.matrixToFractions(C),
      operation: 'solution'
    });
    
    return { result: C, steps, detailedSteps };
  }

  subtractMatrices(A: number[][], B: number[][]) {
    if (A.length !== B.length || A[0].length !== B[0].length) {
      throw new Error('Вычитание возможно только для матриц одинакового размера');
    }
    const m = A.length, n = A[0].length;
    const C = Array.from({ length: m }, (_, i) =>
      Array.from({ length: n }, (_, j) => A[i][j] - B[i][j])
    );
    const steps: string[] = [
      `═══ ВЫЧИТАНИЕ МАТРИЦ ═══`,
      ``,
      `Формула: C = A - B, где c[i,j] = a[i,j] - b[i,j]`,
    ];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходные матрицы
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${m}×${n}\n` +
        `Элементы матрицы A (уменьшаемое)`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });
    
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица B:\n\n` +
        `Размер: ${m}×${n}\n` +
        `Элементы матрицы B (вычитаемое)`,
      matrix: this.matrixToFractions(B),
      operation: 'swap'
    });
    
    // Вычисление элементов
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const partialC = Array.from({ length: m }, (_, pi) =>
          Array.from({ length: n }, (__, pj) => {
            if (pi < i || (pi === i && pj <= j)) {
              return A[pi][pj] - B[pi][pj];
            }
            return 0;
          })
        );
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Вычисление элемента C[${i+1},${j+1}]:\n\n` +
            `• A[${i+1},${j+1}] = ${this.toFraction(A[i][j])}\n` +
            `• B[${i+1},${j+1}] = ${this.toFraction(B[i][j])}\n` +
            `• C[${i+1},${j+1}] = ${this.toFraction(A[i][j])} - ${this.toFraction(B[i][j])} = ${this.toFraction(C[i][j])}`,
          matrix: this.matrixToFractions(partialC),
          operation: 'eliminate',
          pivot: { row: i, col: j }
        });
      }
    }
    
    // Финальная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат вычитания:\n\n` +
        `Матрица C = A - B размером ${m}×${n}\n` +
        `Все элементы вычислены`,
      matrix: this.matrixToFractions(C),
      operation: 'solution'
    });
    
    return { result: C, steps, detailedSteps };
  }

  transposeMatrix(A: number[][]) {
    const m = A.length, n = A[0].length;
    const T = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => A[j][i])
    );
    const steps: string[] = [
      `═══ ТРАНСПОНИРОВАНИЕ МАТРИЦЫ ═══`,
      ``,
      `Правило: (A^T)[i,j] = A[j,i]`,
    ];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${m}×${n} (${m} строк, ${n} столбцов)\n` +
        `Будем менять строки и столбцы местами`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });
    
    // Показываем процесс транспонирования построчно
    for (let i = 0; i < n; i++) {
      const partialT = Array.from({ length: n }, (_, pi) =>
        Array.from({ length: m }, (__, pj) => {
          if (pi <= i) {
            return A[pj][pi];
          }
          return 0;
        })
      );
      
      detailedSteps.push({
        step: stepCounter++,
        description: `Формирование ${i+1}-й строки матрицы A^T:\n\n` +
          `• Берём ${i+1}-й столбец матрицы A и делаем его строкой\n` +
          `• Элементы: ${Array.from({ length: m }, (_, j) => `A[${j+1},${i+1}] = ${this.toFraction(A[j][i])}`).join(', ')}\n` +
          `• Строка ${i+1} матрицы A^T: [${Array.from({ length: m }, (_, j) => this.toFraction(A[j][i])).join(', ')}]`,
        matrix: this.matrixToFractions(partialT),
        operation: 'eliminate',
        pivot: { row: i, col: 0 }
      });
    }
    
    // Финальная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат транспонирования:\n\n` +
        `Матрица A^T размером ${n}×${m}\n` +
        `Строки стали столбцами, столбцы стали строками`,
      matrix: this.matrixToFractions(T),
      operation: 'solution'
    });
    
    return { result: T, steps, detailedSteps };
  }

  scalarMultiply(A: number[][], k: number) {
    const m = A.length, n = A[0].length;
    const C = A.map(row => row.map(val => val * k));
    const steps: string[] = [
      `═══ УМНОЖЕНИЕ МАТРИЦЫ НА ЧИСЛО ═══`,
      ``,
      `Формула: C = k · A, где k = ${this.toFraction(k)}`,
    ];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${m}×${n}\n` +
        `Каждый элемент будет умножен на k = ${this.toFraction(k)}`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });
    
    // Вычисление элементов
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const partialC = Array.from({ length: m }, (_, pi) =>
          Array.from({ length: n }, (__, pj) => {
            if (pi < i || (pi === i && pj <= j)) {
              return A[pi][pj] * k;
            }
            return 0;
          })
        );
        
        detailedSteps.push({
          step: stepCounter++,
          description: `Вычисление элемента C[${i+1},${j+1}]:\n\n` +
            `• A[${i+1},${j+1}] = ${this.toFraction(A[i][j])}\n` +
            `• k = ${this.toFraction(k)}\n` +
            `• C[${i+1},${j+1}] = ${this.toFraction(k)} · ${this.toFraction(A[i][j])} = ${this.toFraction(C[i][j])}`,
          matrix: this.matrixToFractions(partialC),
          operation: 'eliminate',
          pivot: { row: i, col: j }
        });
      }
    }
    
    // Финальная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат умножения:\n\n` +
        `Матрица C = ${this.toFraction(k)} · A размером ${m}×${n}\n` +
        `Все элементы умножены на k`,
      matrix: this.matrixToFractions(C),
      operation: 'solution'
    });
    
    return { result: C, steps, detailedSteps };
  }

  matrixPower(A: number[][], p: number) {
    if (A.length !== A[0].length) {
      throw new Error('Возведение в степень определено только для квадратных матриц');
    }
    if (!Number.isInteger(p) || p < 0 || p > 20) {
      throw new Error('Степень должна быть целым числом 0..20');
    }
    const n = A.length;
    const identity: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) as number)
    );
    let result: number[][] = identity;
    let base: number[][] = A;
    let exp = p;
    const steps: string[] = [
      `═══ ВОЗВЕДЕНИЕ МАТРИЦЫ В СТЕПЕНЬ ═══`,
      ``,
      `Метод быстрого возведения в степень p = ${p}`,
    ];
    const detailedSteps: GaussStep[] = [];
    let stepCounter = 1;
    
    // Исходная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Исходная матрица A:\n\n` +
        `Размер: ${n}×${n} (квадратная)\n` +
        `Будет возведена в степень ${p}`,
      matrix: this.matrixToFractions(A),
      operation: 'swap'
    });
    
    // Начальное значение - единичная матрица
    detailedSteps.push({
      step: stepCounter++,
      description: `Инициализация:\n\n` +
        `Результат = E (единичная матрица)\n` +
        `Базовая матрица = A\n` +
        `A^0 = E`,
      matrix: this.matrixToFractions(identity),
      operation: 'swap'
    });
    
    let stepNum = 1;
    while (exp > 0) {
      if (exp % 2 === 1) {
        const prevResult = result.map(row => [...row]);
        result = this.multiplyMatrices(result, base).result;
        detailedSteps.push({
          step: stepCounter++,
          description: `Шаг ${stepNum}: Степень ${exp} нечётная\n\n` +
            `Умножаем текущий результат на базовую матрицу\n` +
            `Результат = Результат × Базовая матрица`,
          matrix: this.matrixToFractions(result),
          operation: 'eliminate'
        });
        stepNum++;
      }
      exp = Math.floor(exp / 2);
      if (exp > 0) {
        base = this.multiplyMatrices(base, base).result;
        detailedSteps.push({
          step: stepCounter++,
          description: `Шаг ${stepNum}: Квадрат базовой матрицы\n\n` +
            `Возводим базовую матрицу в квадрат\n` +
            `Переходим к степени ${exp}`,
          matrix: this.matrixToFractions(base),
          operation: 'normalize'
        });
        stepNum++;
      }
    }
    
    // Финальный результат
    detailedSteps.push({
      step: stepCounter++,
      description: `Результат возведения в степень:\n\n` +
        `Матрица A^${p} размером ${n}×${n}\n` +
        `Вычисление завершено`,
      matrix: this.matrixToFractions(result),
      operation: 'solution'
    });
    
    return { result, steps, detailedSteps };
  }

  rankWithSteps(A: number[][]) {
    // Копируем, чтобы не портить исходную
    const copy = A.map(row => [...row]);
    const rank = this.calculateRank(copy);
    const m = A.length;
    const n = A[0].length;
    const steps = [
      `═══ ВЫЧИСЛЕНИЕ РАНГА МАТРИЦЫ ═══`,
      ``,
      `Шаг 1. Исходная матрица:`,
      `  • A имеет размер ${m}×${n}`,
      ``,
      `Шаг 2. Метод вычисления:`,
      `  • Ранг матрицы — это максимальное количество линейно независимых строк`,
      `  • Приводим матрицу к ступенчатому виду методом Гаусса`,
      `  • Подсчитываем количество ненулевых строк`,
      ``,
      `Шаг 3. Приведение к ступенчатому виду:`,
      `  • Выполняем элементарные преобразования строк`,
      `  • Зануляем элементы под главной диагональю`,
      `  • Получаем матрицу в ступенчатом виде`,
      ``,
      `Шаг 4. Подсчёт ранга:`,
      `  • Количество ненулевых строк после приведения: ${rank}`,
      ``,
      `Результат: rank(A) = ${rank}`,
    ];
    return { rank, steps };
  }
}

