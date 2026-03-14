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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <Loader className="w-16 h-16 text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Проверка email...
              </h2>
              <p className="text-gray-600">
                Пожалуйста, подождите
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email подтверждён!
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              {userData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <p className="text-sm text-green-900">
                    <strong>Email:</strong> {userData.email}
                  </p>
                  {userData.name && (
                    <p className="text-sm text-green-900 mt-1">
                      <strong>Имя:</strong> {userData.name}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Перенаправление на главную страницу через 3 секунды...
                </p>
                <Button
                  onClick={() => router.push('/')}
                  className="w-full gradient-primary text-white"
                >
                  Перейти сейчас
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ошибка верификации
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth')}
                  className="w-full gradient-primary text-white"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
