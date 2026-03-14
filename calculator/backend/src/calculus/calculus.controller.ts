import { Controller, Post, Body } from '@nestjs/common';
import { CalculusService } from './calculus.service';
import { CalculusDto } from './dto/calculus.dto';
import { DerivativeDto, DerivativeAtPointDto } from './dto/derivative.dto';

@Controller('calculus')
export class CalculusController {
  constructor(private readonly calculusService: CalculusService) {}

  @Post('derivative')
  async calculateDerivative(@Body() calculusDto: any) {
    return this.calculusService.calculateDerivative(calculusDto);
  }

  // Новый endpoint для детального вычисления производной
  @Post('derivative/detailed')
  async calculateDerivativeDetailed(@Body() derivativeDto: DerivativeDto) {
    return this.calculusService.calculateDerivativeDetailed(derivativeDto);
  }

  // Новый endpoint для производной с графиками
  @Post('derivative/graph')
  async calculateDerivativeWithGraph(@Body() derivativeDto: DerivativeDto) {
    return this.calculusService.calculateDerivativeWithGraph(derivativeDto);
  }

  // Новый endpoint для значения производной в точке
  @Post('derivative/at-point')
  async calculateDerivativeAtPoint(@Body() derivativeAtPointDto: DerivativeAtPointDto) {
    return this.calculusService.calculateDerivativeAtPoint(derivativeAtPointDto);
  }

  @Post('integral')
  async calculateIntegral(@Body() calculusDto: any) {
    return this.calculusService.calculateIntegral(calculusDto);
  }
}

