import { Module } from '@nestjs/common';
import { ClusteringController } from './clustering.controller';
import { ClusteringService } from './clustering.service';

@Module({
  controllers: [ClusteringController],
  providers: [ClusteringService],
  exports: [ClusteringService],
})
export class ClusteringModule {}

