'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/UI/Button';
import { GaussResult } from '@/types/calculator';
import { apiService } from '@/services/api';
import { StepGuide } from '@/components/UI/StepGuide';
import { InteractiveHint } from '@/components/UI/InteractiveHint';
import { AnimatedResult } from '@/components/UI/AnimatedResult';
import { Fraction } from '@/components/UI/Fraction';
import { TextWithFractions } from '@/components/UI/TextWithFractions';
import { MathExpression } from '@/components/UI/MathExpression';
import { motion } from 'framer-motion';

const matrixSchema = z.object({
  variables: z.number().min(2, 'Минимум 2 переменные').max(6, 'Максимум 6 переменных'),
  operation: z.enum(['gauss', 'inverse', 'determinant', 'multiply', 'multiplyMatrices', 'add', 'subtract', 'transpose', 'scalar', 'power', 'rank']),
  matrix: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
  matrix2: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
  dimsA: z.object({ rows: z.number().min(1), cols: z.number().min(1) }).optional(),
  dimsB: z.object({ rows: z.number().min(0), cols: z.number().min(0) }).optional(),
  scalarK: z.number().optional(),
  powerP: z.number().optional(),
});

type MatrixFormInputs = z.infer<typeof matrixSchema>;

// Функция для преобразования десятичного числа в дробь
const decimalToFraction = (decimal: number | string): string => {
  // Если уже строка (дробь), возвращаем как есть
  if (typeof decimal === 'string') {
    return decimal;
  }
  if (Number.isNaN(decimal)) return 'неопределено';
  if (!isFinite(decimal)) return decimal.toString();
  
  if (Number.isInteger(decimal)) {
    return decimal.toString();
  }

  // Защита от очень больших или очень маленьких чисел
  if (Math.abs(decimal) > 1000000 || Math.abs(decimal) < 1e-10) {
    // Для очень больших или маленьких чисел принудительно ищем дробь
    return forceFraction(decimal);
  }

  const tolerance = 1e-6;
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = decimal;
  let iterations = 0;
  const maxIterations = 100; // Защита от бесконечного цикла
  
    do {
      const a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
    const diff = b - a;
    if (Math.abs(diff) < 1e-12) {
      return forceFraction(decimal);
    }
    b = 1 / diff;
    iterations++;
    
    // Защита от бесконечного цикла
    if (iterations > maxIterations) {
      // Если не удалось найти точную дробь, принудительно ищем дробь
      return forceFraction(decimal);
    }
    if (!isFinite(k1) || !isFinite(h1)) {
      return forceFraction(decimal);
    }
  } while (Math.abs(decimal - h1 / k1) > Math.abs(decimal) * tolerance);

  const numerator = h1;
  const denominator = k1;

  // Дополнительная защита от очень больших чисел
  if (Math.abs(numerator) > 1000000 || Math.abs(denominator) > 1000000) {
    // Для очень больших чисел принудительно ищем дробь
    return forceFraction(decimal);
  }
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return forceFraction(decimal);
  }

  // Упрощаем дробь
  const gcd = (a: number, b: number, depth: number = 0): number => {
    // Защита от бесконечной рекурсии
    if (depth > 100) {
      return 1;
    }
    
    if (b === 0) return a;
    if (a === 0) return b;
    
    // Защита от бесконечной рекурсии
    if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) {
      return 1; // Если числа слишком большие, не упрощаем
    }
    
    // Округляем до целых чисел для избежания проблем с плавающей точкой
    const intA = Math.round(a);
    const intB = Math.round(b);
    
    // Если числа очень маленькие, возвращаем 1
    if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) {
      return 1;
    }
    
    return gcd(intB, intA % intB, depth + 1);
  };
  
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;

  if (!isFinite(simplifiedNum) || !isFinite(simplifiedDen) || simplifiedDen === 0) {
    return forceFraction(decimal);
  }
  if (simplifiedDen === 1) {
    return simplifiedNum.toString();
  }

  if (simplifiedDen < 0) {
    return `${-simplifiedNum}/${-simplifiedDen}`;
  }

  return `${simplifiedNum}/${simplifiedDen}`;
};

// Принудительное преобразование в дробь
const forceFraction = (num: number): string => {
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
      const gcd = (a: number, b: number, depth: number = 0): number => {
        if (depth > 100) return 1;
        if (b === 0) return a;
        if (a === 0) return b;
        if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) return 1;
        
        const intA = Math.round(a);
        const intB = Math.round(b);
        
        if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) {
          return 1;
        }
        
        return gcd(intB, intA % intB, depth + 1);
      };
      
      const divisor = gcd(Math.abs(numerator), den);
      const simplifiedNum = numerator / divisor;
      const simplifiedDen = den / divisor;
      
      if (simplifiedDen === 1) return simplifiedNum.toString();
      if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
      return `${simplifiedNum}/${simplifiedDen}`;
    }
  }
  
  // Если ничего не найдено, используем более точный подход
  const precision = 1e-12;
  const denominator = Math.round(1 / precision);
  const numerator = Math.round(num * denominator);
  
  const gcd = (a: number, b: number, depth: number = 0): number => {
    if (depth > 100) return 1;
    if (b === 0) return a;
    if (a === 0) return b;
    if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) return 1;
    
    const intA = Math.round(a);
    const intB = Math.round(b);
    
    if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) {
      return 1;
    }
    
    return gcd(intB, intA % intB, depth + 1);
  };
  
  const divisor = gcd(Math.abs(numerator), denominator);
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;
  
  if (simplifiedDen === 1) return simplifiedNum.toString();
  if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
  return `${simplifiedNum}/${simplifiedDen}`;
};

const MatricesPage = () => {
  const [activeTab, setActiveTab] = useState<'operations' | 'gauss'>('operations');
  const [result, setResult] = useState<GaussResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState(3);
  const [matrix, setMatrix] = useState<(string | number)[][]>([]);
  const [matrix2, setMatrix2] = useState<(string | number)[][]>([]);
  const [opMatrixResult, setOpMatrixResult] = useState<number[][] | null>(null);
  const [kValueA, setKValueA] = useState<number>(2);
  const [pValueA, setPValueA] = useState<number>(2);
  const [kValueB, setKValueB] = useState<number>(2);
  const [pValueB, setPValueB] = useState<number>(2);
  const [determinantMethod, setDeterminantMethod] = useState<string>('laplace'); // Метод вычисления определителя
  const [showMethodSelect, setShowMethodSelect] = useState(false); // Показать ли выбор метода
  const [laplaceType, setLaplaceType] = useState<string>('row'); // 'row' или 'column'
  const [laplaceIndex, setLaplaceIndex] = useState<number>(0); // индекс строки/столбца

  const matrixSteps = [
    {
      id: 'step1',
      title: 'Выберите количество переменных',
      description: 'Укажите количество неизвестных в системе уравнений. Рекомендуется начать с 3 переменных.',
      content: (
        <div className="space-y-2">
          <p>• Введите количество переменных (от 2 до 6)</p>
          <p>• Система уравнений будет автоматически создана</p>
          <p>• Переменные будут обозначены как x1, x2, x3, ...</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Заполните систему уравнений',
      description: 'Введите коэффициенты при переменных и правые части уравнений.',
      content: (
        <div className="space-y-2">
          <p>• Введите коэффициенты при x1, x2, x3, ...</p>
          <p>• Введите правые части уравнений</p>
          <p>• Используйте десятичные числа (например, 2.5, -1.3)</p>
          <p>• Для отсутствующих переменных введите 0</p>
        </div>
      ),
    },
    {
      id: 'step3',
      title: 'Выберите операцию',
      description: 'Выберите тип операции, которую хотите выполнить с матрицей.',
      content: (
        <div className="space-y-2">
          <p>• <strong>Метод Гаусса:</strong> решение системы линейных уравнений</p>
          <p>• <strong>Обратная матрица:</strong> нахождение A⁻¹</p>
          <p>• <strong>Определитель:</strong> вычисление det(A)</p>
          <p>• <strong>Умножение:</strong> умножение на вектор</p>
        </div>
      ),
    },
    {
      id: 'step4',
      title: 'Получите результат',
      description: 'Нажмите кнопку "Решить" и получите подробный результат с пошаговым решением.',
      content: (
        <div className="space-y-2">
          <p>• Результат отобразится внизу страницы</p>
          <p>• Показываются все шаги метода Гаусса</p>
          <p>• Результат можно скопировать</p>
        </div>
      ),
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MatrixFormInputs>({
    resolver: zodResolver(matrixSchema),
    defaultValues: {
      variables: 3,
      operation: 'gauss',
      dimsA: { rows: 3, cols: 3 },
      dimsB: { rows: 3, cols: 3 },
      scalarK: 2,
      powerP: 2,
    },
  });

  const operation = watch('operation');
  const scalarK = watch('scalarK');
  const powerP = watch('powerP');

  // Инициализация матрицы при изменении количества переменных
  const initializeMatrix = useCallback((vars: number) => {
    // Для вкладки операций создаём квадратную матрицу vars×vars
    // Для вкладки Гаусса — расширенную vars×(vars+1)
    const cols = activeTab === 'gauss' ? vars + 1 : vars;
    const newMatrix = Array.from({ length: vars }, () => Array.from({ length: cols }, () => ''));
    setMatrix(newMatrix);
    setValue('matrix', newMatrix);
  }, [setValue, activeTab]);

  // Инициализация второй матрицы (для операций, где нужна B)
  const initializeMatrix2 = (rows: number, cols: number) => {
    const newMatrix2 = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
    setMatrix2(newMatrix2);
    setValue('matrix2', newMatrix2);
  };

  // Обновление значения в ячейке матрицы
  const updateMatrixCell = (row: number, col: number, value: string) => {
    const newMatrix = matrix.map((rowArray, rowIndex) => 
      rowIndex === row 
        ? rowArray.map((cell, colIndex) => colIndex === col ? value : cell)
        : [...rowArray]
    );
    setMatrix(newMatrix);
    setValue('matrix', newMatrix);
  };
  // Изменение размеров матрицы A (с сохранением имеющихся значений)
  const resizeMatrixA = (rows: number, cols: number) => {
    const newA = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => (matrix[i]?.[j] ?? ''))
    );
    setMatrix(newA);
    setValue('matrix', newA);
  };

  // Изменение размеров матрицы B
  const resizeMatrixB = (rows: number, cols: number) => {
    const newB = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => (matrix2[i]?.[j] ?? ''))
    );
    setMatrix2(newB);
    setValue('matrix2', newB);
  };

  const clearMatrixA = () => {
    const rows = matrix.length || 3;
    const cols = matrix[0]?.length || 3;
    const clearedMatrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '0'));
    setMatrix(clearedMatrix);
    setValue('matrix', clearedMatrix);
  };

  const clearMatrixB = () => {
    const rows = matrix2.length || 3;
    const cols = matrix2[0]?.length || 3;
    const clearedMatrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '0'));
    setMatrix2(clearedMatrix);
    setValue('matrix2', clearedMatrix);
  };

  // Обновление значения в ячейке второй матрицы
  const updateMatrix2Cell = (row: number, col: number, value: string) => {
    const newMatrix2 = matrix2.map((rowArray, rowIndex) => 
      rowIndex === row 
        ? rowArray.map((cell, colIndex) => colIndex === col ? value : cell)
        : [...rowArray]
    );
    setMatrix2(newMatrix2);
    setValue('matrix2', newMatrix2);
  };

  // Вспомогательные преобразования
  const getNumericA = () => {
    const parsed = parseMatrixToNumbers(matrix);
    // Для вкладки операций берём всю матрицу, для Гаусса — без последнего столбца
    return activeTab === 'operations' ? parsed : parsed.map(row => row.slice(0, -1));
  };
  const getNumericB = () => parseMatrixToNumbers(matrix2);

  // Панель действий для A
  const onATranspose = async () => {
    const A = getNumericA();
    const res = await apiService.transposeMatrix({ matrix: A });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };
  const onAScalar = async () => {
    const A = getNumericA();
    const res = await apiService.scalarMultiply({ matrix: A, k: kValueA });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };
  const onADeterminant = async () => {
    const A = getNumericA();
    
    // Проверяем размер матрицы для правила Саррюса
    if (determinantMethod === 'sarrus' && A.length !== 3) {
      alert('Правило Саррюса применимо только для матриц 3×3');
      return;
    }
    
    // Проверяем индекс для метода Лапласа
    if (determinantMethod === 'laplace' && laplaceIndex >= A.length) {
      alert(`Индекс ${laplaceType === 'row' ? 'строки' : 'столбца'} не может быть больше ${A.length - 1}`);
      return;
    }
    
    const det = await apiService.calculateDeterminant({ 
      matrix: A, 
      method: determinantMethod,
      laplaceType: determinantMethod === 'laplace' ? laplaceType : undefined,
      laplaceIndex: determinantMethod === 'laplace' ? laplaceIndex : undefined
    });
    setOpMatrixResult(null);
    const detVal = typeof det.determinant === 'number' ? det.determinant : Number(det.determinant);
    setResult({ 
      solution: [], 
      steps: det.steps ?? [`det(A) = ${decimalToFraction(detVal)}`], 
      determinant: { determinant: detVal, rank: det.rank }, 
      rank: det.rank, 
      detailedSteps: det.detailedSteps ?? [] 
    });
    setShowMethodSelect(false); // Скрываем выбор метода после вычисления
  };
  const onARank = async () => {
    const A = getNumericA();
    const r = await apiService.matrixRank({ matrix: A });
    setOpMatrixResult(null);
    setResult({ solution: [], steps: r.steps, determinant: { determinant: 0, rank: r.rank }, rank: r.rank, detailedSteps: [] });
  };
  const onAInverse = async () => {
    const A = getNumericA();
    const inv = await apiService.calculateInverse({ matrix: A });
    console.log('Inverse response:', inv);
    console.log('DetailedSteps:', inv.detailedSteps);
    setOpMatrixResult(inv.inverse);
    setResult({ 
      solution: [], 
      steps: inv.steps ?? [], 
      determinant: { determinant: 0, rank: 0 }, 
      rank: 0, 
      detailedSteps: inv.detailedSteps ?? [] 
    });
  };
  const onAPower = async () => {
    const A = getNumericA();
    const res = await apiService.matrixPower({ matrix: A, power: pValueA });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };

  // Панель действий для B
  const onBTranspose = async () => {
    const B = getNumericB();
    if (!B.length) return;
    const res = await apiService.transposeMatrix({ matrix: B });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };
  const onBScalar = async () => {
    const B = getNumericB();
    if (!B.length) return;
    const res = await apiService.scalarMultiply({ matrix: B, k: kValueB });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };

  // Центральная панель: A ± B, A × B
  const onAplusB = async () => {
    const A = getNumericA();
    const B = getNumericB();
    if (!A.length || !B.length) return alert('Заполните матрицы A и B');
    if (A.length !== B.length || A[0].length !== B[0].length) return alert('Для A±B размеры матриц должны совпадать');
    const res = await apiService.addMatrices({ matrixA: A, matrixB: B });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };
  const onAminusB = async () => {
    const A = getNumericA();
    const B = getNumericB();
    if (!A.length || !B.length) return alert('Заполните матрицы A и B');
    if (A.length !== B.length || A[0].length !== B[0].length) return alert('Для A−B размеры матриц должны совпадать');
    const res = await apiService.subtractMatrices({ matrixA: A, matrixB: B });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };
  const onAmulB = async () => {
    const A = getNumericA();
    const B = getNumericB();
    if (!A.length || !B.length) return alert('Заполните матрицы A и B');
    if (A[0].length !== B.length) return alert(`Для A(m×n)·B(n×p) необходимо n(A) = m(B). Текущие: n(A)=${A[0].length}, m(B)=${B.length}`);
    const res = await apiService.multiplyMatrices({ matrixA: A, matrixB: B });
    setOpMatrixResult(res.result);
    setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: res.detailedSteps ?? [] });
  };

  // Обработка изменения количества переменных
  const handleVariablesChange = (value: number) => {
    setVariables(value);
    setValue('variables', value);
    initializeMatrix(value);
    
    if (operation === 'multiply') {
      // Для умножения вторая матрица должна иметь количество строк равное количеству столбцов первой
      const newMatrix2Size = { rows: value, cols: 1 }; // Умножение на вектор (столбец)
      initializeMatrix2(newMatrix2Size.rows, newMatrix2Size.cols);
    } else if (operation === 'multiplyMatrices') {
      // Для умножения матриц B должно иметь rows = cols(A) = value
      const rowsB = value;
      const colsB = value;
      initializeMatrix2(rowsB, colsB);
    }
  };


  // Функция для преобразования строк в числа
  const parseMatrixToNumbers = (matrix: (string | number)[][]) => {
    return matrix.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          const num = parseFloat(cell);
          return isNaN(num) ? 0 : num;
        }
        return cell;
      })
    );
  };

  // Функция для проверки заполненности матрицы
  const validateMatrix = (matrix: (string | number)[][], matrixName: string) => {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        const cell = matrix[i][j];
        if (cell === '' || (typeof cell === 'string' && cell.trim() === '')) {
          throw new Error(`Заполните все поля в ${matrixName}. Пустое поле в строке ${i + 1}, столбце ${j + 1}`);
        }
      }
    }
  };

  const onSubmit = async (data: MatrixFormInputs) => {
    setIsLoading(true);
    setResult(null);
    setOpMatrixResult(null);
    try {
      console.log('Form data:', data);
      console.log('Matrix state:', matrix);
      console.log('Matrix2 state:', matrix2);
      
      // Проверяем заполненность основной матрицы
      validateMatrix(matrix, 'основной матрице');
      
      // Преобразуем матрицы в числа
      const numericMatrix = parseMatrixToNumbers(matrix);
      const numericMatrix2 = parseMatrixToNumbers(matrix2);
      
      let result: GaussResult;
      switch (data.operation) {
        case 'gauss':
          // Разделяем расширенную матрицу на коэффициенты и правые части
          const coefficients = numericMatrix.map(row => row.slice(0, -1));
          const rightHandSide = numericMatrix.map(row => row[row.length - 1]);
          
          result = await apiService.solveGauss({
            matrix: coefficients,
            vector: rightHandSide,
          });
          break;
        case 'inverse':
          // Для обратной матрицы используем только коэффициенты
          const coefficientsForInverse = numericMatrix.map(row => row.slice(0, -1));
          const inverseResult = await apiService.calculateInverse({
            matrix: coefficientsForInverse,
          });
          // Преобразуем результат в формат GaussResult
          result = {
            solution: [],
            steps: inverseResult.steps || [],
            determinant: inverseResult.determinant,
            rank: 0,
            detailedSteps: inverseResult.detailedSteps || []
          };
          break;
        case 'determinant':
          // Для определителя используем только коэффициенты
          const coefficientsForDet = numericMatrix.map(row => row.slice(0, -1));
          const detResult = await apiService.calculateDeterminant({
            matrix: coefficientsForDet,
          });
          // Преобразуем результат в формат GaussResult
          result = {
            solution: [],
            steps: detResult.steps || [],
            determinant: detResult.determinant,
            rank: detResult.rank,
            detailedSteps: detResult.detailedSteps || []
          };
          break;
        case 'multiply':
          if (!numericMatrix2 || matrix2.length === 0) {
            alert('Введите вторую матрицу для умножения');
            return;
          }
          // Проверяем заполненность второй матрицы
          validateMatrix(matrix2, 'второй матрице');
          // Для умножения матрицы на вектор используем коэффициенты и вектор
          const coefficientsForMult = numericMatrix.map(row => row.slice(0, -1));
          const vector = numericMatrix2.map(row => row[0]); // Берем первый столбец (вектор)
          result = await apiService.multiplyByVector({
            matrix: coefficientsForMult,
            vector: vector,
          });
          break;
        case 'multiplyMatrices':
          if (!numericMatrix2 || matrix2.length === 0) {
            alert('Введите матрицу B для умножения');
            return;
          }
          validateMatrix(matrix2, 'матрице B');
          // Коэффициенты A: убираем последний столбец (если был как правая часть)
          const A = numericMatrix.map(row => row.slice(0, -1));
          const B = numericMatrix2;
          // Валидация совместимости
          if (A.length === 0 || A[0].length === 0 || B.length === 0 || B[0].length === 0) {
            throw new Error('Матрицы не должны быть пустыми');
          }
          if (A[0].length !== B.length) {
            throw new Error(`Для умножения A(m×n) и B(n×p) необходимо n(A) = m(B). Сейчас: n(A)=${A[0].length}, m(B)=${B.length}`);
          }
          const multRes = await apiService.multiplyMatrices({ matrixA: A, matrixB: B });
          // Адаптируем к текущему типу результата
          result = {
            solution: [],
            steps: multRes.steps,
            determinant: { determinant: 0, rank: 0 },
            rank: 0,
            detailedSteps: [],
          };
          setOpMatrixResult(multRes.result);
          break;
        case 'add': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const B = numericMatrix2;
          if (A.length !== B.length || A[0].length !== B[0].length) {
            throw new Error('Для сложения требуется одинаковый размер A и B');
          }
          const res = await apiService.addMatrices({ matrixA: A, matrixB: B });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] };
          setOpMatrixResult(res.result);
          break;
        }
        case 'subtract': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const B = numericMatrix2;
          if (A.length !== B.length || A[0].length !== B[0].length) {
            throw new Error('Для вычитания требуется одинаковый размер A и B');
          }
          const res = await apiService.subtractMatrices({ matrixA: A, matrixB: B });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] };
          setOpMatrixResult(res.result);
          break;
        }
        case 'transpose': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const res = await apiService.transposeMatrix({ matrix: A });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] };
          setOpMatrixResult(res.result);
          break;
        }
        case 'scalar': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const k = typeof scalarK === 'number' ? scalarK : Number(scalarK);
          const res = await apiService.scalarMultiply({ matrix: A, k });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] };
          setOpMatrixResult(res.result);
          break;
        }
        case 'power': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const p = typeof powerP === 'number' ? powerP : Number(powerP);
          const res = await apiService.matrixPower({ matrix: A, power: p });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] };
          setOpMatrixResult(res.result);
          break;
        }
        case 'rank': {
          const A = numericMatrix.map(row => row.slice(0, -1));
          const res = await apiService.matrixRank({ matrix: A });
          result = { solution: [], steps: res.steps, determinant: { determinant: 0, rank: res.rank }, rank: res.rank, detailedSteps: [] };
          break;
        }
        default:
          throw new Error('Неизвестная операция');
      }

      setResult(result);
    } catch (error) {
      console.error('Ошибка расчета:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при выполнении операции с матрицей';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Перетипографировать MathJax при изменении result/steps
  useEffect(() => {
    const mj = (window as { MathJax?: { typesetPromise?: () => void; typeset?: () => void } })?.MathJax;
    if (mj?.typesetPromise) {
      mj.typesetPromise();
    } else if (mj?.typeset) {
      mj.typeset();
    }
  }, [result, opMatrixResult]);

  // Инициализация матриц A и B при загрузке
  useEffect(() => {
    initializeMatrix(variables);
  }, [variables, initializeMatrix]);

  // Инициализация B при переключении на вкладку операций
  useEffect(() => {
    if (activeTab === 'operations' && matrix2.length === 0) {
      const newB = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ''));
      setMatrix2(newB);
      setValue('matrix2', newB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, setValue]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold" style={{ color: 'var(--foreground)' }}>
              Операции с матрицами
            </h1>
            <StepGuide
              steps={matrixSteps}
              title="Инструкция по работе с матрицами"
              description="Пошаговое руководство по использованию калькулятора матриц"
            />
          </div>
          <p className="text-xl" style={{ color: 'var(--foreground-secondary)' }}>
            Решайте системы уравнений, находите обратные матрицы и определители
          </p>
        </div>

        {/* Вкладки */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border p-1" style={{ borderColor: 'var(--border)', background: 'var(--background-secondary)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={`px-6 py-2 rounded-md transition-all ${activeTab === 'operations' ? 'gradient-primary text-[#1c1917]' : ''}`}
              style={activeTab === 'operations' ? {} : { color: 'var(--foreground-secondary)' }}
            >
              Операции с матрицами
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gauss')}
              className={`px-6 py-2 rounded-md transition-all ${activeTab === 'gauss' ? 'gradient-primary text-[#1c1917]' : ''}`}
              style={activeTab === 'gauss' ? {} : { color: 'var(--foreground-secondary)' }}
            >
              Метод Гаусса (СЛАУ)
            </button>
          </div>
        </div>

      {activeTab === 'operations' && (
      <form onSubmit={handleSubmit(onSubmit)} 
        className="p-8 rounded-2xl shadow-xl mb-8 card-hover"
        style={{ 
          background: 'var(--background-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Две панели A и B - обновленный дизайн */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Панель A */}
          <div className="p-6 rounded-2xl border-2 shadow-lg transition-all hover:shadow-xl" 
            style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 100%)' }}>
            <div className="mb-4">
              <div className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--gold)' }}>A</div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <button type="button" 
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={clearMatrixA}>
                  🗑️ Очистить
                </button>
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                  <span>Размер:</span>
                  <input type="number" min={1} max={10} value={matrix.length || 3} onChange={(e)=>resizeMatrixA(parseInt(e.target.value)||1, matrix[0]?.length||3)}
                    className="w-14 px-2 py-1 text-center border rounded font-mono" style={{ borderColor: 'var(--border)' }} />
                  <span style={{ color: 'var(--foreground-secondary)' }}>×</span>
                  <input type="number" min={1} max={10} value={matrix[0]?.length || 3} onChange={(e)=>resizeMatrixA(matrix.length||3, parseInt(e.target.value)||1)}
                    className="w-14 px-2 py-1 text-center border rounded font-mono" style={{ borderColor: 'var(--border)' }} />
                </div>
              </div>
            </div>
            <div className="overflow-auto card-midnight p-4 rounded-xl shadow-inner" style={{ borderColor: 'var(--border)' }}>
              <table className="min-w-full border-collapse">
                <tbody>
                  {matrix.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="p-1.5">
                          <input value={cell as string} onChange={(e)=>updateMatrixCell(i,j,e.target.value)}
                            className="w-20 px-3 py-2 rounded-lg border-2 text-center font-mono font-semibold transition-all  focus:outline-none "
                            style={{ borderColor: 'var(--border)' }}
                            placeholder="0" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Кнопки действий под панелью A - обновленный стиль */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* 1. Определитель - в самом верху */}
              <div className="col-span-2">
                <button type="button" 
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={() => setShowMethodSelect(!showMethodSelect)}>
                  Найти определитель {showMethodSelect ? '▲' : '▼'}
                </button>
                {showMethodSelect && (
                  <div className="mt-2 p-3 rounded-lg border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-sm font-semibold mb-2">Выберите метод:</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethod" 
                          value="laplace"
                          checked={determinantMethod === 'laplace'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">1. Разложение по элементам строки или столбца</span>
                      </label>
                      
                      {/* Дополнительные опции для метода Лапласа */}
                      {determinantMethod === 'laplace' && (
                        <div className="ml-6 mt-2 p-2  rounded space-y-2">
                          <div className="text-xs font-medium ">Разложить по:</div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name="laplaceType" 
                                value="row"
                                checked={laplaceType === 'row'}
                                onChange={(e) => setLaplaceType(e.target.value)}
                                className="w-3 h-3" 
                              />
                              <span className="text-xs">Строке</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name="laplaceType" 
                                value="column"
                                checked={laplaceType === 'column'}
                                onChange={(e) => setLaplaceType(e.target.value)}
                                className="w-3 h-3" 
                              />
                              <span className="text-xs">Столбцу</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs ">Номер {laplaceType === 'row' ? 'строки' : 'столбца'}:</label>
                            <select 
                              value={laplaceIndex}
                              onChange={(e) => setLaplaceIndex(parseInt(e.target.value))}
                              className="px-2 py-1 text-xs border rounded focus:border-[#D4AF37] focus:outline-none">
                              {Array.from({ length: variables }, (_, i) => (
                                <option key={i} value={i}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethod" 
                          value="sarrus"
                          checked={determinantMethod === 'sarrus'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">2. Правило Саррюса (только 3×3)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethod" 
                          value="triangle"
                          checked={determinantMethod === 'triangle'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">3. Метод треугольника (метод Гаусса)</span>
                      </label>
                    </div>
                    <button 
                      type="button"
                      className="w-full mt-3 px-4 py-2 rounded-lg gradient-primary text-[#1c1917] font-medium hover:opacity-95 transition-all"
                      onClick={onADeterminant}>
                      Вычислить
                    </button>
                  </div>
                )}
              </div>
              
              {/* 2. Обратная матрица */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-[rgba(212,175,55,0.08)]"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={onAInverse}>
                Обратная матрица A<sup>-1</sup>
              </button>
              
              {/* 3. Ранг */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-[rgba(232,197,71,0.1)]"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={onARank}>
                Найти ранг
              </button>
              
              {/* 4. Транспонировать */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={onATranspose}>
                Транспонировать
              </button>
              
              {/* 5. Умножить*/}
              <div className="col-span-2 flex items-center gap-2">
                <button type="button" 
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={onAScalar}>
                  Умножить на
                </button>
                <input type="number" step="any" value={kValueA} onChange={(e)=>setKValueA(parseFloat(e.target.value)||0)}
                  className="w-20 px-2 py-2.5 text-sm border-2 rounded-lg text-center font-mono transition-all  focus:outline-none" 
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="k" />
              </div>
              
              {/* 6. Возвести в степень */}
              <div className="col-span-2 flex items-center gap-2">
                <button type="button" 
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={onAPower}>
                  Возвести в степень
                </button>
                <input type="number" min={0} max={20} value={pValueA} onChange={(e)=>setPValueA(parseInt(e.target.value)||0)}
                  className="w-20 px-2 py-2.5 text-sm border-2 rounded-lg text-center font-mono transition-all  focus:outline-none" 
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="p" />
              </div>
            </div>
          </div>

          {/* Центральная панель операций между A и B - единый стиль */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-4 p-4">
            <button type="button" 
              className="px-6 py-3 rounded-lg border-2 font-medium text-base transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
              style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
              onClick={onAplusB}>
              A + B
            </button>
            <button type="button" 
              className="px-6 py-3 rounded-lg border-2 font-medium text-base transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
              style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
              onClick={onAminusB}>
              A − B
            </button>
            <button type="button" 
              className="px-6 py-3 rounded-lg border-2 font-medium text-base transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
              style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
              onClick={onAmulB}>
              A × B
            </button>
          </div>

          {/* Панель B - обновленный дизайн */}
          <div className="p-6 rounded-2xl border-2 shadow-lg transition-all hover:shadow-xl" 
            style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 100%)' }}>
            <div className="mb-4">
              <div className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--gold)' }}>B</div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <button type="button" 
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={clearMatrixB}>
                  🗑️ Очистить
                </button>
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                  <span>Размер:</span>
                  <input type="number" min={1} max={10} value={matrix2.length || 3} onChange={(e)=>resizeMatrixB(parseInt(e.target.value)||1, matrix2[0]?.length||3)}
                    className="w-14 px-2 py-1 text-center border rounded font-mono" style={{ borderColor: 'var(--border)' }} />
                  <span style={{ color: 'var(--foreground-secondary)' }}>×</span>
                  <input type="number" min={1} max={10} value={matrix2[0]?.length || 3} onChange={(e)=>resizeMatrixB(matrix2.length||3, parseInt(e.target.value)||1)}
                    className="w-14 px-2 py-1 text-center border rounded font-mono" style={{ borderColor: 'var(--border)' }} />
                </div>
              </div>
            </div>
            <div className="overflow-auto card-midnight p-4 rounded-xl shadow-inner" style={{ borderColor: 'var(--border)' }}>
              <table className="min-w-full border-collapse">
                <tbody>
                  {matrix2.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="p-1.5">
                          <input value={cell as string} onChange={(e)=>updateMatrix2Cell(i,j,e.target.value)}
                            className="w-20 px-3 py-2 rounded-lg border-2 text-center font-mono font-semibold transition-all focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none hover:border-[#D4AF37]/50"
                            style={{ borderColor: 'var(--border)' }}
                            placeholder="0" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Кнопки действий под панелью B - обновленный стиль */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* 1. Определитель - в самом верху */}
              <div className="col-span-2">
                <button type="button" 
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={() => setShowMethodSelect(!showMethodSelect)}>
                  Найти определитель {showMethodSelect ? '▲' : '▼'}
                </button>
                {showMethodSelect && (
                  <div className="mt-2 p-3 rounded-lg border-2 card-midnight" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-sm font-semibold mb-2">Выберите метод:</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethodB" 
                          value="laplace"
                          checked={determinantMethod === 'laplace'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">1. Разложение по элементам строки или столбца</span>
                      </label>
                      
                      {/* Дополнительные опции для метода Лапласа */}
                      {determinantMethod === 'laplace' && (
                        <div className="ml-6 mt-2 p-2  rounded space-y-2">
                          <div className="text-xs font-medium ">Разложить по:</div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name="laplaceTypeB" 
                                value="row"
                                checked={laplaceType === 'row'}
                                onChange={(e) => setLaplaceType(e.target.value)}
                                className="w-3 h-3" 
                              />
                              <span className="text-xs">Строке</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name="laplaceTypeB" 
                                value="column"
                                checked={laplaceType === 'column'}
                                onChange={(e) => setLaplaceType(e.target.value)}
                                className="w-3 h-3" 
                              />
                              <span className="text-xs">Столбцу</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs ">Номер {laplaceType === 'row' ? 'строки' : 'столбца'}:</label>
                            <select 
                              value={laplaceIndex}
                              onChange={(e) => setLaplaceIndex(parseInt(e.target.value))}
                              className="px-2 py-1 text-xs border rounded focus:border-[#D4AF37] focus:outline-none">
                              {Array.from({ length: variables }, (_, i) => (
                                <option key={i} value={i}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethodB" 
                          value="sarrus"
                          checked={determinantMethod === 'sarrus'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">2. Правило Саррюса (только 3×3)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-90 p-2 rounded">
                        <input 
                          type="radio" 
                          name="determinantMethodB" 
                          value="triangle"
                          checked={determinantMethod === 'triangle'}
                          onChange={(e) => setDeterminantMethod(e.target.value)}
                          className="w-4 h-4" 
                        />
                        <span className="text-sm">3. Метод треугольника (метод Гаусса)</span>
                      </label>
                    </div>
                    <button 
                      type="button"
                      className="w-full mt-3 px-4 py-2 rounded-lg gradient-primary text-[#1c1917] font-medium hover:opacity-95 transition-all"
                      onClick={async()=>{
                        const B = getNumericB();
                        if (!B.length) return;
                        if (determinantMethod === 'sarrus' && B.length !== 3) {
                          alert('Правило Саррюса применимо только для матриц 3×3');
                          return;
                        }
                        if (determinantMethod === 'laplace' && laplaceIndex >= B.length) {
                          alert(`Индекс ${laplaceType === 'row' ? 'строки' : 'столбца'} не может быть больше ${B.length - 1}`);
                          return;
                        }
                        const det = await apiService.calculateDeterminant({ 
                          matrix: B, 
                          method: determinantMethod,
                          laplaceType: determinantMethod === 'laplace' ? laplaceType : undefined,
                          laplaceIndex: determinantMethod === 'laplace' ? laplaceIndex : undefined
                        });
                        setOpMatrixResult(null);
                        const detVal = typeof det.determinant === 'number' ? det.determinant : Number(det.determinant);
                        setResult({ 
                          solution: [], 
                          steps: det.steps ?? [`det(B) = ${decimalToFraction(detVal)}`], 
                          determinant: { determinant: detVal, rank: det.rank }, 
                          rank: det.rank, 
                          detailedSteps: det.detailedSteps ?? [] 
                        });
                        setShowMethodSelect(false);
                      }}>
                      Вычислить
                    </button>
                  </div>
                )}
              </div>
              
              {/* 2. Обратная матрица */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-[rgba(212,175,55,0.08)]"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={async()=>{
                const B = getNumericB();
                if (!B.length) return;
                const inv = await apiService.calculateInverse({ matrix: B });
                setOpMatrixResult(inv.inverse);
                setResult({ 
                  solution: [], 
                  steps: inv.steps ?? [], 
                  determinant: { determinant: 0, rank: 0 }, 
                  rank: 0, 
                  detailedSteps: inv.detailedSteps ?? [] 
                });
              }}>
                Обратная матрица B<sup>-1</sup>
              </button>
              
              {/* 3. Ранг */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-[rgba(232,197,71,0.1)]"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={async()=>{
                const B = getNumericB();
                if (!B.length) return;
                const r = await apiService.matrixRank({ matrix: B });
                setOpMatrixResult(null);
                setResult({ solution: [], steps: r.steps, determinant: { determinant: 0, rank: r.rank }, rank: r.rank, detailedSteps: [] });
              }}>
                Найти ранг
              </button>
              
              {/* 4. Транспонировать */}
              <button type="button" 
                className="col-span-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md hover:bg-gradient-to-r "
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                onClick={onBTranspose}>
                Транспонировать
              </button>
              
              {/* 5. Умножить */}
              <div className="col-span-2 flex items-center gap-2">
                <button type="button" 
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={onBScalar}>
                  Умножить на
                </button>
                <input type="number" step="any" value={kValueB} onChange={(e)=>setKValueB(parseFloat(e.target.value)||0)}
                  className="w-20 px-2 py-2.5 text-sm border-2 rounded-lg text-center font-mono transition-all focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none" 
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="k" />
              </div>
              
              {/* 6. Возвести в степень */}
              <div className="col-span-2 flex items-center gap-2">
                <button type="button" 
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                  onClick={async()=>{
                  const B = getNumericB();
                  if (!B.length) return;
                  const res = await apiService.matrixPower({ matrix: B, power: pValueB });
                  setOpMatrixResult(res.result);
                  setResult({ solution: [], steps: res.steps, determinant: { determinant: 0, rank: 0 }, rank: 0, detailedSteps: [] });
                }}>
                  Возвести в степень
                </button>
                <input type="number" min={0} max={20} value={pValueB} onChange={(e)=>setPValueB(parseInt(e.target.value)||0)}
                  className="w-20 px-2 py-2.5 text-sm border-2 rounded-lg text-center font-mono transition-all focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none" 
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="p" />
              </div>
            </div>
          </div>
        </div>

        {/* Блок вывода результата C - обновленный дизайн */}
        {(opMatrixResult || (result && result.steps && result.steps.length > 0)) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-8 rounded-2xl border-2 shadow-xl" 
            style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 100%)' }}>
            {opMatrixResult && (
              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#D4AF37] to-[#E8C547] bg-clip-text text-transparent">
                  Результат C
                </h3>
                <div className="overflow-auto card-midnight p-6 rounded-xl border-2 shadow-inner" style={{ borderColor: 'var(--border)' }}>
                  <table className="mx-auto border-collapse">
                    <tbody>
                      {opMatrixResult.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-6 py-4 text-center border-2 font-mono text-xl font-bold transition-all hover:bg-[rgba(232,197,71,0.08)]" 
                              style={{ borderColor: '#e0e0e0' }}>
                              <Fraction value={decimalToFraction(cell)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result && result.steps && result.steps.length > 0 && (
              <div className="mb-6">
                <h4 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <span className="text-3xl">📝</span>
                  Пошаговое решение
                </h4>
                <div className="card-midnight p-6 rounded-xl border-2 shadow-inner max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                  <div className="space-y-4">
                    {result.steps.map((s, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-base leading-relaxed p-3 rounded-lg hover:opacity-90 transition-all"
                      >
                        <MathExpression expression={s} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && result.detailedSteps && result.detailedSteps.length > 0 && (
              <div>
                <h4 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <span className="text-3xl">🔍</span>
                  Детальные шаги с визуализацией
                </h4>
                <div className="card-midnight p-6 rounded-xl border-2 shadow-inner max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                  {result.detailedSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="mb-6 p-5 rounded-xl border-2 shadow-md hover:shadow-lg transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 gradient-primary text-[#1c1917] font-bold text-sm rounded-full">
                            Шаг {step.step}
                          </span>
                        </div>
                        <div className="text-base font-medium leading-relaxed  bg-[rgba(212,175,55,0.06)] p-4 rounded-lg">
                          <MathExpression expression={step.description.replaceAll('Infinity/Infinity', 'деление на ноль (неопределено)')} />
                        </div>
                      </div>
                      
                      {/* Матрица - обновленный стиль */}
                      <div className="overflow-x-auto bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg">
                        <table className="mx-auto border-collapse shadow-sm">
                          <tbody>
                            {step.matrix.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex}>
                                {row.map((cell: any, colIndex: number) => (
                                  <td
                                    key={colIndex}
                                    className={`px-4 py-3 text-center border-2 text-base font-mono font-semibold transition-all ${
                                      step.pivot && step.pivot.row === rowIndex && step.pivot.col === colIndex
                                        ? 'bg-yellow-300 text-yellow-900 scale-110 shadow-lg'
                                        : 'card-midnight hover:opacity-90'
                                    }`}
                                    style={{
                                      borderColor: step.pivot && step.pivot.row === rowIndex && step.pivot.col === colIndex
                                        ? '#fbbf24'
                                        : '#e0e0e0'
                                    }}
                                  >
                                    <Fraction value={decimalToFraction(cell)} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Дополнительная информация - обновленные бейджи */}
                      {step.operation === 'eliminate' && step.factor && (
                        <div className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold inline-block" style={{ background: 'rgba(212,175,55,0.2)', color: 'var(--foreground)' }}>
                          📊 Коэффициент: <Fraction value={decimalToFraction(step.factor)} />
                        </div>
                      )}
                      {step.operation === 'normalize' && (
                        <div className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold inline-block bg-[rgba(212,175,55,0.12)] text-[#d4c4a0]">
                          ✓ Диагональный элемент нормализован к 1
                        </div>
                      )}
                      {step.operation === 'solution' && (
                        <div className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold inline-block" style={{ background: 'rgba(212,175,55,0.2)', color: 'var(--foreground)' }}>
                          ✓ Результат получен
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </form>
      )}

      {activeTab === 'gauss' && (
        <form onSubmit={handleSubmit(onSubmit)} 
          className="p-8 rounded-2xl shadow-xl mb-8 card-hover border-2"
          style={{ 
            background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 100%)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div className="mb-8 p-6 rounded-xl card-midnight shadow-md border-2" style={{ borderColor: 'var(--border)' }}>
            <InteractiveHint
              title="Количество переменных"
              content="Укажите количество неизвестных в системе уравнений. Система будет иметь столько же уравнений."
              type="info"
            >
              <label htmlFor="variables" className="block text-xl font-bold mb-4 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                <span className="text-2xl"></span>
                Количество переменных
              </label>
            </InteractiveHint>
            <input
              type="number"
              id="variables"
              {...register('variables')}
              onChange={(e) => handleVariablesChange(parseInt(e.target.value) || 2)}
              className="w-full h-14 px-5 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2  text-lg font-semibold"
              style={{ 
                borderColor: 'var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)'
              }}
              min="2"
              max="6"
              placeholder="Введите количество переменных"
            />
            {errors.variables && <p className="text-red-500 text-sm italic mt-2">⚠️ {errors.variables.message}</p>}
          </div>

          {/* Система уравнений для Гаусса */}
          <div className="mb-8 p-6 rounded-xl card-midnight shadow-md border-2" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
              <span className="text-2xl"></span>
              Система линейных уравнений
            </h3>
            <div className="space-y-4">
              {matrix.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center space-x-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                    Уравнение {rowIndex + 1}:
                  </span>
                  <div className="flex items-center space-x-1">
                    {row.slice(0, -1).map((coeff, colIndex) => (
                      <div key={colIndex} className="flex items-center">
                        <input
                          type="number"
                          value={coeff === '' ? '' : coeff}
                          onChange={(e) => updateMatrixCell(rowIndex, colIndex, e.target.value)}
                          className={`w-16 h-10 text-center border-2 rounded-lg focus:outline-none focus:ring-2  ${
                            coeff === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          style={{
                            borderColor: coeff === '' ? '#fca5a5' : 'var(--border)',
                            background: coeff === '' ? '#fef2f2' : 'var(--background)',
                            color: 'var(--foreground)'
                          }}
                          step="any"
                          placeholder=""
                        />
                        <span className="mx-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          x{colIndex + 1}
                        </span>
                        {colIndex < row.length - 2 && (
                          <span className="mx-1 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                            +
                          </span>
                        )}
                      </div>
                    ))}
                    <span className="mx-2 text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                      =
                    </span>
                    <input
                      type="number"
                      value={row[row.length - 1] === '' ? '' : row[row.length - 1]}
                      onChange={(e) => updateMatrixCell(rowIndex, row.length - 1, e.target.value)}
                      className={`w-16 h-10 text-center border-2 rounded-lg focus:outline-none focus:ring-2  ${
                        row[row.length - 1] === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      style={{
                        borderColor: row[row.length - 1] === '' ? '#fca5a5' : 'var(--border)',
                        background: row[row.length - 1] === '' ? '#fef2f2' : 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                      step="any"
                      placeholder=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" loading={isLoading} disabled={isLoading} 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r gradient-primary ">
            {isLoading ? '⏳ Решаем...' : ' Решить систему методом Гаусса'}
          </Button>
        </form>
      )}

      {activeTab === 'gauss' && result && (
        <AnimatedResult
          type="calculation"
          title="Результат вычислений"
          delay={0.2}
        >
          {/* Отображаем сообщение о типе решения */}
          {'solutionType' in result && result.message && (
            <div className="mb-4">
              <div className={`p-4 rounded-lg border-l-4 ${
                result.solutionType === 'unique' ? 'bg-[rgba(212,175,55,0.06)] border-[#D4AF37]' :
                result.solutionType === 'infinite' ? 'bg-[rgba(212,175,55,0.06)] border-[#D4AF37]' :
                'bg-yellow-50 border-yellow-500'
              }`}>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    result.solutionType === 'unique' ? 'bg-[#D4AF37]' :
                    result.solutionType === 'infinite' ? 'bg-[rgba(212,175,55,0.06)]0' :
                    'bg-yellow-500'
                  }`}></span>
                  {result.message}
                </h4>
              </div>
            </div>
          )}

          {result.solution && result.solution.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                {result.solutionType === 'infinite' ? 'Общее решение:' : 'Решение:'}
              </h4>
              <div className=" p-4 rounded-lg font-mono text-lg" style={{ background: 'var(--background-tertiary)' }}>
                <div className="space-y-2">
                  {result.solution.map((x, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {result.solutionType === 'infinite' ? (
                        // Для бесконечного множества решений отображаем строку как есть
                        <span className="text-base">{x}</span>
                      ) : (
                        // Для единственного решения отображаем в виде дроби
                        <>
                          <span className="text-sm ">x{index + 1} =</span>
                          <span className="text-xl font-bold">
                            <Fraction value={decimalToFraction(x)} />
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.determinant !== undefined && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[rgba(212,175,55,0.06)]0 rounded-full"></span>
                Определитель:
              </h4>
              <div className=" p-3 rounded-lg font-mono text-xl" style={{ background: 'var(--background-tertiary)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    <Fraction value={typeof result.determinant === 'object' 
                      ? decimalToFraction(result.determinant.determinant || 0)
                      : decimalToFraction(result.determinant || 0)
                    } />
                  </span>
                </div>
              </div>
            </div>
          )}

          {result.rank !== undefined && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                Ранг матрицы:
              </h4>
              <div className=" p-3 rounded-lg font-mono text-xl" style={{ background: 'var(--background-tertiary)' }}>
                {result.rank}
              </div>
            </div>
          )}

          {result.detailedSteps && result.detailedSteps.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[rgba(232,197,71,0.08)]0 rounded-full"></span>
                Пошаговое решение:
              </h4>
              <div className=" p-4 rounded-lg max-h-96 overflow-y-auto" style={{ background: 'var(--background-tertiary)' }}>
                {result.detailedSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-4 p-3 rounded-lg border"
                    style={{ 
                      background: 'var(--background-secondary)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#D4AF37] font-bold text-sm">
                          Шаг {step.step}:
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-relaxed">
                        <MathExpression expression={step.description.replaceAll('Infinity/Infinity', 'деление на ноль (неопределено)')} />
                      </div>
                    </div>
                    
                    {/* Матрица */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <tbody>
                          {step.matrix.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td
                                  key={colIndex}
                                  className={`px-3 py-2 text-center border text-sm font-mono ${
                                    step.pivot && step.pivot.row === rowIndex && step.pivot.col === colIndex
                                      ? 'bg-yellow-200 font-bold'
                                      : 'card-midnight'
                                  }`}
                                  style={{
                                    borderColor: 'var(--border)',
                                    background: step.pivot && step.pivot.row === rowIndex && step.pivot.col === colIndex
                                      ? 'var(--background-tertiary)'
                                      : 'var(--background)'
                                  }}
                                >
                                  <Fraction value={decimalToFraction(cell)} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Дополнительная информация */}
                    {step.operation === 'eliminate' && step.factor && (
                        <div className="mt-2 text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                        Коэффициент: <Fraction value={decimalToFraction(step.factor)} />
                      </div>
                    )}
                    {step.operation === 'normalize' && (
                      <div className="mt-2 text-xs text-[#c9b896] font-medium">
                        ✓ Диагональный элемент нормализован к 1
                      </div>
                    )}
                    {step.operation === 'solution' && (
                      <div className="mt-2 text-xs text-[#D4AF37] font-medium">
                        ✓ Матрица приведена к единичному виду
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatedResult>
      )}
    </div>
    </div>
  );
};


export default MatricesPage;