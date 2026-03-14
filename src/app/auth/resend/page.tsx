'use client';

import { useState } from 'react';
import { API_URL } from '@/config';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) ? errData.message[0] : errData.message;
        throw new Error(msg || 'Ошибка отправки');
      }

      const data = await response.json();
      setMessage(data.message || 'Письмо отправлено! Проверьте почту.');
      
      if (data.devEmailPreview) {
        console.log('🔗 Ссылка для просмотра письма:', data.devEmailPreview);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки письма');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Link
            href="/auth"
            className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Назад к входу
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Повторная отправка письма
            </h2>
            <p className="text-gray-600">
              Введите email для повторной отправки письма подтверждения
            </p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full gradient-primary text-white py-3"
            >
              {isLoading ? 'Отправка...' : 'Отправить письмо'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
