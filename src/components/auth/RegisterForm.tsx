'use client';

import { useState } from 'react';
import { API_URL } from '@/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI/Button';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка регистрации');
      }

      const result = await response.json();
      
      setSuccessMessage(result.message || 'Регистрация успешна!');
      
      // Ссылка на просмотр письма только если письмо реально отправлено (DEV)
      if (result.devEmailPreview) {
        setEmailPreviewUrl(result.devEmailPreview);
        console.log('📧 Просмотр письма:', result.devEmailPreview);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="card-midnight p-8">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
          Регистрация
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className={`mb-4 p-4 rounded-lg ${emailPreviewUrl ? 'bg-[rgba(212,175,55,0.08)] border border-[#D4AF37]/25' : ''}`} style={!emailPreviewUrl ? { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)' } : {}}>
            <p className={`text-sm font-semibold mb-2 ${emailPreviewUrl ? 'text-[#c9b896]' : ''}`} style={!emailPreviewUrl ? { color: 'var(--foreground)' } : {}}>
              {successMessage}
            </p>
            {emailPreviewUrl ? (
              <>
                <p className="text-xs text-[#78716c] mb-2">
                  📧 В режиме разработки письма не доставляются на реальный email. Используйте ссылку ниже:
                </p>
                <div className="mt-3 p-3 bg-[rgba(212,175,55,0.06)] border border-[#D4AF37]/25 rounded">
                  <p className="text-xs text-[#D4AF37] font-semibold mb-1">🔗 Открыть письмо в браузере:</p>
                  <a
                    href={emailPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#E8C547] hover:underline break-all"
                  >
                    {emailPreviewUrl}
                  </a>
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                Перейдите на страницу <a href="/auth/resend" className="underline font-medium">повторной отправки</a> или обратитесь к администратору.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
              Имя (необязательно)
            </label>
            <input
              {...register('name')}
              className="w-full px-4 py-3 input-midnight"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3 input-midnight"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
              Пароль
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 input-midnight"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
              Подтвердите пароль
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-3 input-midnight"
              placeholder="••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full gradient-primary text-[#1c1917] font-bold py-3"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>

        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#D4AF37] font-semibold hover:text-[#E8C547]"
              >
                Войти
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
