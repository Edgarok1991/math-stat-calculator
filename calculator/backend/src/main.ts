import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Включение CORS — разрешаем Vercel, localhost и FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || '';
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3003',
        'https://math-stat-calculator.vercel.app',
        'https://www.math-stat-calculator.vercel.app',
        ...(frontendUrl ? [frontendUrl] : []),
      ];
      const isAllowed = !origin || allowed.includes(origin) || origin.endsWith('.vercel.app');
      callback(null, isAllowed);
    },
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
