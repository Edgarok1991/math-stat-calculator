import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Проверка существования пользователя
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Генерация токена верификации
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Создание пользователя (не подтверждён)
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
        verificationToken,
      },
    });

    // Отправка письма верификации
    try {
      const emailResult = await this.emailService.sendVerificationEmail(
        email,
        verificationToken,
        name || undefined,
      );

      console.log('📧 Письмо верификации отправлено');
      console.log('🔗 Ссылка для просмотра (DEV):', emailResult.previewUrl);

      return {
        message: 'Регистрация успешна! Проверьте email для активации аккаунта.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
        // В DEV режиме возвращаем ссылку на просмотр письма
        devEmailPreview: process.env.NODE_ENV === 'development' ? emailResult.previewUrl : undefined,
      };
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      
      // Если письмо не отправилось, всё равно создаём пользователя
      return {
        message: 'Регистрация успешна, но письмо не отправлено. Обратитесь к администратору.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      };
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Поиск пользователя
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерация токена (вход разрешён без подтверждения email)
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async verifyEmail(token: string) {
    // Поиск пользователя по токену
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Неверный или истёкший токен верификации');
    }

    if (user.emailVerified) {
      return {
        message: 'Email уже подтверждён',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      };
    }

    // Подтверждаем email и удаляем токен
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    // Отправляем приветственное письмо
    await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.name || undefined);

    // Генерируем токен для автоматического входа
    const jwtToken = this.generateToken(updatedUser.id, updatedUser.email);

    return {
      message: 'Email успешно подтверждён!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified,
      },
      token: jwtToken,
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email уже подтверждён');
    }

    // Генерируем новый токен
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Отправляем письмо
    try {
      const emailResult = await this.emailService.sendVerificationEmail(
        email,
        verificationToken,
        user.name || undefined,
      );

      return {
        message: 'Письмо верификации отправлено повторно',
        devEmailPreview: process.env.NODE_ENV === 'development' ? emailResult.previewUrl : undefined,
      };
    } catch (error) {
      console.error('Ошибка повторной отправки email:', error);
      throw new ServiceUnavailableException(
        'Сервис отправки писем временно недоступен. Обратитесь к администратору.',
      );
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }
}
