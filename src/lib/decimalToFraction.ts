/**
 * Преобразование десятичного числа в дробь для отображения по всему приложению.
 * Использует цепные дроби для нахождения наилучшего приближения.
 */

const MAX_DENOMINATOR = 1000; // Если знаменатель больше — показываем десятичную форму

const gcd = (a: number, b: number, depth = 0): number => {
  if (depth > 100) return 1;
  if (b === 0) return a;
  if (a === 0) return b;
  if (Math.abs(a) > 1000000 || Math.abs(b) > 1000000) return 1;
  const intA = Math.round(a);
  const intB = Math.round(b);
  if (Math.abs(intA) < 0.000001 || Math.abs(intB) < 0.000001) return 1;
  return gcd(intB, intA % intB, depth + 1);
};

const forceFraction = (num: number): string => {
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
      const divisor = gcd(Math.abs(numerator), den);
      const simplifiedNum = numerator / divisor;
      const simplifiedDen = den / divisor;
      if (simplifiedDen === 1) return simplifiedNum.toString();
      if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
      return `${simplifiedNum}/${simplifiedDen}`;
    }
  }

  const precision = 1e-12;
  const denominator = Math.round(1 / precision);
  const numerator = Math.round(num * denominator);
  const divisor = gcd(Math.abs(numerator), denominator);
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;
  if (simplifiedDen === 1) return simplifiedNum.toString();
  if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
  if (simplifiedDen > MAX_DENOMINATOR) return num.toFixed(4);
  return `${simplifiedNum}/${simplifiedDen}`;
};

/**
 * Преобразует число в строку-дробь (например, "3/4") или десятичную форму при неудаче.
 */
export const decimalToFraction = (decimal: number | string, decimals = 4): string => {
  if (typeof decimal === 'string') return decimal;
  if (Number.isNaN(decimal)) return '—';
  if (!isFinite(decimal)) return decimal.toString();
  if (Number.isInteger(decimal)) return decimal.toString();
  if (Math.abs(decimal) > 1000000 || Math.abs(decimal) < 1e-10) return forceFraction(decimal);

  const tolerance = 1e-6;
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = decimal;
  let iterations = 0;
  const maxIterations = 100;

  do {
    const a = Math.floor(b);
    let aux = h1; h1 = a * h1 + h2; h2 = aux;
    aux = k1; k1 = a * k1 + k2; k2 = aux;
    const diff = b - a;
    if (Math.abs(diff) < 1e-12) return forceFraction(decimal);
    b = 1 / diff;
    iterations++;
    if (iterations > maxIterations) return forceFraction(decimal);
    if (!isFinite(k1) || !isFinite(h1)) return forceFraction(decimal);
  } while (Math.abs(decimal - h1 / k1) > Math.abs(decimal) * tolerance);

  const numerator = h1;
  const denominator = k1;
  if (Math.abs(numerator) > 1000000 || Math.abs(denominator) > 1000000) return forceFraction(decimal);
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) return forceFraction(decimal);
  if (denominator > MAX_DENOMINATOR) return decimal.toFixed(decimals);

  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;
  if (!isFinite(simplifiedNum) || !isFinite(simplifiedDen) || simplifiedDen === 0) return forceFraction(decimal);
  if (simplifiedDen === 1) return simplifiedNum.toString();
  if (simplifiedDen < 0) return `${-simplifiedNum}/${-simplifiedDen}`;
  return `${simplifiedNum}/${simplifiedDen}`;
};
