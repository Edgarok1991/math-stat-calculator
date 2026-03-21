import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async saveCalculation(
    @Request() req,
    @Body() body: { type: string; input: unknown; result: unknown },
  ) {
    return this.historyService.saveCalculation(req.user.id, body.type, body.input, body.result);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req, @Query('type') type?: string) {
    return this.historyService.getUserCalculations(req.user.id, type);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCalculation(@Request() req, @Param('id') id: string) {
    return this.historyService.deleteCalculation(id, req.user.id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async clearHistory(@Request() req) {
    return this.historyService.clearHistory(req.user.id);
  }
}
