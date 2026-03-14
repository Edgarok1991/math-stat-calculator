import { Controller, Get, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(@Request() req, @Query('type') type?: string) {
    return this.historyService.getUserCalculations(req.user.id, type);
  }

  @Delete(':id')
  async deleteCalculation(@Request() req, @Param('id') id: string) {
    return this.historyService.deleteCalculation(id, req.user.id);
  }

  @Delete()
  async clearHistory(@Request() req) {
    return this.historyService.clearHistory(req.user.id);
  }
}
