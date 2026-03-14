import { Module } from '@nestjs/common';
import { AnovaController } from './anova.controller';
import { AnovaService } from './anova.service';

@Module({
  controllers: [AnovaController],
  providers: [AnovaService],
  exports: [AnovaService],
})
export class AnovaModule {}

