import { Module } from '@nestjs/common';
import { RegressionController } from './regression.controller';
import { RegressionService } from './regression.service';

@Module({
  controllers: [RegressionController],
  providers: [RegressionService],
  exports: [RegressionService],
})
export class RegressionModule {}

