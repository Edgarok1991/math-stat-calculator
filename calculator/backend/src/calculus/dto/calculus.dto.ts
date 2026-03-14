// Валидация отключена для тестирования

class BoundsDto {
  lower: number;
  upper: number;
}

export class CalculusDto {
  expression: string;
  variable: string;
  type: 'derivative' | 'integral';
  bounds?: BoundsDto;
}

