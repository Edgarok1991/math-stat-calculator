import { Controller, Post, Body } from '@nestjs/common';
import { RegressionService } from './regression.service';
import { RegressionDto } from './dto/regression.dto';

@Controller('regression')
export class RegressionController {
  constructor(private readonly regressionService: RegressionService) {}

  @Post('calculate')
  async calculateRegression(@Body() regressionDto: any) {
    return this.regressionService.calculateRegression(regressionDto);
  }
}

