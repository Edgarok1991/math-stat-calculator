import { Controller, Post, Body } from '@nestjs/common';
import { ClusteringService } from './clustering.service';
import { ClusteringDto } from './dto/clustering.dto';

@Controller('clustering')
export class ClusteringController {
  constructor(private readonly clusteringService: ClusteringService) {}

  @Post('calculate')
  async calculateClustering(@Body() clusteringDto: any) {
    return this.clusteringService.calculateClustering(clusteringDto);
  }
}

