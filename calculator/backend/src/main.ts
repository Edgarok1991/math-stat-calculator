import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Включение CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const corsOrigins = [
    frontendUrl,
    'http://localhost:3000',
    'http://localhost:3003',
    'https://math-stat-calculator.vercel.app',
    'https://www.math-stat-calculator.vercel.app',
  ];
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Валидация полностью отключена
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   transform: true,
  // }));
  
  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend сервер запущен на порту 3001');
}
bootstrap();
