'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI/Button';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
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
          Вход в систему
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)' }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <Button
            type="submit"
            loading={isLoading}
            className="w-full gradient-primary text-[#1c1917] font-bold py-3"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#D4AF37] font-semibold hover:text-[#E8C547]"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
