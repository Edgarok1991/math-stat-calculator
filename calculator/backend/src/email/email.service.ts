import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private initPromise: Promise<void> | null = null;
  private useEthereal = true;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.ensureTransporter();
  }

  private async ensureTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;
    if (this.initPromise) return this.initPromise.then(() => this.transporter!);

    this.initPromise = this.initTransporter();
    await this.initPromise;
    this.initPromise = null;
    return this.transporter!;
  }

  private async initTransporter(): Promise<void> {
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      // Реальный SMTP (Gmail, Yandex, SendGrid и т.д.)
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.config.get('SMTP_PORT', 587),
        secure: this.config.get('SMTP_SECURE', 'false') === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.useEthereal = false;
      console.log('📧 Email сервис: реальный SMTP', smtpHost);
    } else {
      // Ethereal для разработки (письма не доставляются на реальный email)
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.useEthereal = true;
      console.log('📧 Email сервис: Ethereal (DEV). Для реальной почты задайте SMTP_HOST, SMTP_USER, SMTP_PASS в .env');
    }
  }

  async sendVerificationEmail(email: string, token: string, name?: string) {
    const appUrl = this.config.get('APP_URL') || this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/auth/verify?token=${token}`;
    // Yandex/Gmail требуют, чтобы from совпадал с SMTP_USER
    const fromAddr = this.config.get('SMTP_USER') || 'noreply@mathcalc.com';

    const mailOptions = {
      from: `"MathCalc" <${fromAddr}>`,
      to: email,
      subject: '✉️ Подтверждение регистрации - MathCalc',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧮 MathCalc</h1>
              <p>Добро пожаловать в математический калькулятор!</p>
            </div>
            <div class="content">
              <h2>Привет${name ? ', ' + name : ''}! 👋</h2>
              <p>Спасибо за регистрацию в MathCalc!</p>
              <p>Для завершения регистрации и активации аккаунта, пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">
                  ✅ Подтвердить email
                </a>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Или скопируйте эту ссылку в браузер:<br>
                <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p style="font-size: 14px; color: #6b7280;">
                Если вы не регистрировались на MathCalc, просто проигнорируйте это письмо.
              </p>
            </div>
            <div class="footer">
              <p>© 2026 MathCalc. Математический и статистический калькулятор.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const transporter = await this.ensureTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Письмо отправлено:', info.messageId);
      console.log('🔗 Предпросмотр:', nodemailer.getTestMessageUrl(info));
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    } catch (error) {
      console.error('❌ Ошибка отправки email:', error);
      throw new Error('Не удалось отправить письмо подтверждения');
    }
  }

  async sendWelcomeEmail(email: string, name?: string) {
    const fromAddr = this.config.get('SMTP_USER') || 'noreply@mathcalc.com';
    const mailOptions = {
      from: `"MathCalc" <${fromAddr}>`,
      to: email,
      subject: '🎉 Добро пожаловать в MathCalc!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
              <h1>🧮 MathCalc</h1>
              <h2>Ваш аккаунт активирован!</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2>Привет${name ? ', ' + name : ''}! 🎉</h2>
              <p>Ваш email успешно подтверждён!</p>
              <p>Теперь вы можете пользоваться всеми возможностями MathCalc:</p>
              <ul>
                <li>🧠 Кластерный анализ с дендрограммой</li>
                <li>📊 ANOVA дисперсионный анализ</li>
                <li>∫ Вычисление интегралов и производных</li>
                <li>📈 Множество типов графиков</li>
                <li>🔢 Матричные операции</li>
                <li>📝 История всех ваших вычислений</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.config.get('APP_URL') || this.config.get('FRONTEND_URL') || 'http://localhost:3000'}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  🚀 Начать работу
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const transporter = await this.ensureTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Welcome email отправлен:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка отправки welcome email:', error);
    }
  }
}
