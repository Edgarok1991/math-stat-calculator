'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { motion } from 'framer-motion';
import { Calculator, Lock } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'var(--background)' }}>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex flex-col items-center gap-2 mb-4">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Calculator className="w-8 h-8 text-[#1c1917]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>MathCalc</h1>
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Luxury Gold Edition</p>
          </div>
          <p style={{ color: 'var(--foreground-secondary)' }}>Математический калькулятор с авторизацией</p>
        </motion.div>

        {/* Forms */}
        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass rounded-xl p-6 card-midnight"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Lock className="w-4 h-4" />
            Преимущества авторизации:
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37]">•</span>
              <span>История всех ваших вычислений</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37]">•</span>
              <span>Доступ с любого устройства</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37]">•</span>
              <span>Безопасное хранение данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37]">•</span>
              <span>Персональные настройки</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
