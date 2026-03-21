import { Module } from '@nestjs/common';
import { PhotomathController } from './photomath.controller';
import { PhotomathService } from './photomath.service';

@Module({
  controllers: [PhotomathController],
  providers: [PhotomathService],
  exports: [PhotomathService],
})
export class PhotomathModule {}
