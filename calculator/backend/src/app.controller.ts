import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('multiply')
  multiply(@Body() data: any) {
    console.log('Multiply received:', data);
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
      determinant: 0, // Упрощенно
      rank: matrix.length,
    };
  }

  @Get('test')
  test() {
    return { message: 'Test endpoint works' };
  }
}
