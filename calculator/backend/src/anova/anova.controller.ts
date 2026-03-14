import { Controller, Post, Body } from '@nestjs/common';
import { AnovaService } from './anova.service';
import { AnovaDto } from './dto/anova.dto';

@Controller('anova')
export class AnovaController {
  constructor(private readonly anovaService: AnovaService) {}

  @Post('calculate')
  async calculateAnova(@Body() anovaDto: any) {
    return this.anovaService.calculateAnova(anovaDto);
  }
}

