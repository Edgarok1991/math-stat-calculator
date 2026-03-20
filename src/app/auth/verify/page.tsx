'use client';

import { Suspense, useEffect, useState } from 'react';
import { API_URL } from '@/config';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import { Button } from '@/components/UI/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Токен верификации не найден');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Ошибка верификации');
      }

      const data = await response.json();
      
      setStatus('success');
      setMessage(data.message);
      setUserData(data.user);

      // Если получен JWT токен, автоматически входим
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Перенаправляем на главную через 3 секунды
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Не удалось подтвердить email. Возможно, ссылка устарела.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl shadow-xl p-8 text-center card-midnight">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <Loader className="w-16 h-16 animate-spin" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Проверка email...
              </h2>
              <p style={{ color: 'var(--foreground-secondary)' }}>
                Пожалуйста, подождите
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Email подтверждён!
              </h2>
              <p className="mb-6" style={{ color: 'var(--foreground-secondary)' }}>
                {message}
              </p>
              
              {userData && (
                <div className="p-4 rounded-lg mb-6 border border-green-500/50 bg-green-900/20">
                  <p className="text-sm text-green-300">
                    <strong>Email:</strong> {userData.email}
                  </p>
                  {userData.name && (
                    <p className="text-sm text-green-300 mt-1">
                      <strong>Имя:</strong> {userData.name}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                  Перенаправление на главную страницу через 3 секунды...
                </p>
                <Button
                  onClick={() => router.push('/')}
                  className="w-full gradient-primary text-[#0a1628] font-bold"
                >
                  Перейти сейчас
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <XCircle className="w-16 h-16 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Ошибка верификации
              </h2>
              <p className="mb-6" style={{ color: 'var(--foreground-secondary)' }}>
                {message}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth')}
                  className="w-full gradient-primary text-[#0a1628] font-bold"
                >
                  Вернуться к входу
                </Button>
                <Button
                  onClick={() => router.push('/auth/resend')}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Отправить письмо повторно
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <Loader className="w-12 h-12 animate-spin" style={{ color: 'var(--gold)' }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
