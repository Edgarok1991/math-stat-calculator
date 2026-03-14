export class FunctionGraph2DDto {
  expression: string;    // Функция вида "x^2 + 2*x + 1"
  xMin: number;         // Минимальное значение X
  xMax: number;         // Максимальное значение X
  points?: number;      // Количество точек (по умолчанию 100)
}

export class FunctionGraph3DDto {
  expression: string;    // Функция вида "x^2 + y^2"
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points?: number;      // Количество точек по каждой оси (по умолчанию 20)
}

