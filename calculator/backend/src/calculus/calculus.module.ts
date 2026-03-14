import { Module } from '@nestjs/common';
import { CalculusController } from './calculus.controller';
import { CalculusService } from './calculus.service';

@Module({
  controllers: [CalculusController],
  providers: [CalculusService],
  exports: [CalculusService],
})
export class CalculusModule {}

