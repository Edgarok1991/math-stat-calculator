import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class DerivativeDto {
  @IsString()
  expression: string;

  @IsString()
  variable: string;

  @IsOptional()
  @IsNumber()
  order?: number; // Порядок производной (1, 2, 3...)

  @IsOptional()
  @IsBoolean()
  simplify?: boolean; // Упрощать результат

  @IsOptional()
  @IsNumber()
  xMin?: number; // Для графика

  @IsOptional()
  @IsNumber()
  xMax?: number; // Для графика
}

export class DerivativeAtPointDto {
  @IsString()
  expression: string;

  @IsString()
  variable: string;

  @IsNumber()
  point: number;

  @IsOptional()
  @IsNumber()
  order?: number;
}

