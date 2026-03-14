import { Controller, Post, Body } from '@nestjs/common';
import { MatricesService } from './matrices.service';

@Controller('matrices')
export class MatricesController {
  constructor(private readonly matricesService: MatricesService) {}

  @Post('gauss')
  async solveGauss(@Body() data: any) {
    return this.matricesService.solveGauss(data);
  }

  @Post('inverse')
  async calculateInverse(@Body() data: any) {
    return this.matricesService.calculateInverse(data);
  }

  @Post('determinant')
  async calculateDeterminant(@Body() data: any) {
    return this.matricesService.calculateDeterminant(data);
  }

  @Post('multiply')
  async multiplyByVector(@Body() data: any) {
    console.log('Received data:', data);
    // Прямое выполнение без DTO
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

  // Новое: умножение двух матриц A(m×n) * B(n×p)
  @Post('multiply-matrices')
  async multiplyMatrices(@Body() data: { matrixA: number[][]; matrixB: number[][] }) {
    const { matrixA, matrixB } = data;
    if (!Array.isArray(matrixA) || !Array.isArray(matrixB)) {
      throw new Error('matrixA и matrixB обязательны');
    }
    return this.matricesService.multiplyMatrices(matrixA, matrixB);
  }

  @Post('test')
  async test(@Body() data: any) {
    console.log('Test endpoint received:', data);
    return { message: 'Test successful', data };
  }

  // Новые операции, аналогичные OnlineMSchool
  @Post('add')
  async add(@Body() data: { matrixA: number[][]; matrixB: number[][] }) {
    return this.matricesService.addMatrices(data.matrixA, data.matrixB);
  }

  @Post('subtract')
  async subtract(@Body() data: { matrixA: number[][]; matrixB: number[][] }) {
    return this.matricesService.subtractMatrices(data.matrixA, data.matrixB);
  }

  @Post('transpose')
  async transpose(@Body() data: { matrix: number[][] }) {
    return this.matricesService.transposeMatrix(data.matrix);
  }

  @Post('scalar')
  async scalar(@Body() data: { matrix: number[][]; k: number }) {
    return this.matricesService.scalarMultiply(data.matrix, data.k);
  }

  @Post('power')
  async power(@Body() data: { matrix: number[][]; power: number }) {
    return this.matricesService.matrixPower(data.matrix, data.power);
  }

  @Post('rank')
  async rank(@Body() data: { matrix: number[][] }) {
    return this.matricesService.rankWithSteps(data.matrix);
  }
}

