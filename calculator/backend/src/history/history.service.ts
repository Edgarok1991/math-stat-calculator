import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async saveCalculation(userId: string, type: string, input: any, result: any) {
    return this.prisma.calculation.create({
      data: {
        userId,
        type,
        input,
        result,
      },
    });
  }

  async getUserCalculations(userId: string, type?: string) {
    const where: any = { userId };
    
    if (type) {
      where.type = type;
    }

    return this.prisma.calculation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async deleteCalculation(id: string, userId: string) {
    return this.prisma.calculation.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async clearHistory(userId: string) {
    return this.prisma.calculation.deleteMany({
      where: { userId },
    });
  }
}
