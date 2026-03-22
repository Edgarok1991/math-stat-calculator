import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Пользователь с таким email уже существует';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Запись не найдена';
        break;
      case 'P1001':
      case 'P1002':
      case 'P1003':
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'База данных недоступна. Попробуйте позже.';
        break;
      default:
        this.logger.error(`Prisma error ${exception.code}:`, exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
