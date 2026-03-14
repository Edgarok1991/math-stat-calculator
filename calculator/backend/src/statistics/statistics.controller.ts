import { Controller, Post, Body } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { DescriptiveStatisticsDto } from './dto/statistics.dto';
import { FunctionGraph2DDto, FunctionGraph3DDto } from './dto/function-graph.dto';
import type { DescriptiveStatisticsResult } from './interfaces/statistics-result.interface';
import type { FunctionGraph2DResult, FunctionGraph3DResult } from './interfaces/function-graph.interface';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post('descriptive')
  calculateDescriptive(@Body() dto: DescriptiveStatisticsDto): DescriptiveStatisticsResult {
    return this.statisticsService.calculateDescriptiveStatistics(dto.data);
  }

  @Post('graph-2d')
  calculate2DGraph(@Body() dto: FunctionGraph2DDto): FunctionGraph2DResult {
    return this.statisticsService.calculate2DGraph(
      dto.expression,
      dto.xMin,
      dto.xMax,
      dto.points || 100
    );
  }

  @Post('graph-3d')
  calculate3DGraph(@Body() dto: FunctionGraph3DDto): FunctionGraph3DResult {
    return this.statisticsService.calculate3DGraph(
      dto.expression,
      dto.xMin,
      dto.xMax,
      dto.yMin,
      dto.yMax,
      dto.points || 20
    );
  }
}

