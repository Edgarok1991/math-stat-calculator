import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';
import { RegressionModule } from './regression/regression.module';
import { ClusteringModule } from './clustering/clustering.module';
import { AnovaModule } from './anova/anova.module';
import { MatricesModule } from './matrices/matrices.module';
import { CalculusModule } from './calculus/calculus.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PhotomathModule } from './photomath/photomath.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    HistoryModule,
    RegressionModule,
    ClusteringModule,
    AnovaModule,
    MatricesModule,
    CalculusModule,
    StatisticsModule,
    PhotomathModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
