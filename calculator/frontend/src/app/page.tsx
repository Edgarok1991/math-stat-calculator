'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calculator, BarChart3, Grid3X3, FunctionSquare, Zap, Shield, Globe, Sparkles, Brain, Target, ArrowRight, TrendingUp, PieChart, LineChart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: FunctionSquare,
    title: 'Математический анализ',
    description: 'Производные и интегралы с пошаговым решением, графиками и касательными',
    href: '/calculus',
    gradient: 'gradient-primary',
    color: 'text-indigo-600',
  },
  {
    icon: LineChart,
    title: 'Графики',
    description: '14 типов графиков: Box Plot, Violin, Q-Q, Density, Heatmap, Polar, Contour и другие',
    href: '/graphs',
    gradient: 'gradient-accent',
    color: 'text-cyan-600',
  },
  {
    icon: PieChart,
    title: 'Статистика',
    description: 'Описательная статистика: среднее, медиана, квартили, дисперсия, выбросы',
    href: '/statistics',
    gradient: 'gradient-warning',
    color: 'text-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Регрессионный анализ',
    description: 'Линейная, полиномиальная и экспоненциальная регрессия с визуализацией',
    href: '/regression',
    gradient: 'gradient-secondary',
    color: 'text-pink-600',
  },
  {
    icon: Brain,
    title: 'Анализ данных',
    description: 'Кластеризация и ANOVA - мощные инструменты для статистического анализа',
    href: '/data-analysis',
    gradient: 'gradient-success',
    color: 'text-emerald-600',
  },
  {
    icon: Grid3X3,
    title: 'Матричные операции',
    description: 'Решение СЛАУ методом Гаусса, обратные матрицы, определители',
    href: '/matrices',
    gradient: 'gradient-primary',
    color: 'text-indigo-600',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Быстрые вычисления',
    description: 'Мощные алгоритмы для мгновенных результатов',
    gradient: 'gradient-primary',
  },
  {
    icon: Shield,
    title: 'Точность',
    description: 'Высокая точность вычислений с контролем погрешности',
    gradient: 'gradient-success',
  },
  {
    icon: Globe,
    title: 'Современные технологии',
    description: 'Построено на Next.js, NestJS и современных библиотеках',
    gradient: 'gradient-accent',
  },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован, ничего не показываем (идёт редирект)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                Современный математический инструмент
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="block" style={{ color: 'var(--foreground)' }}>
                Математический и статистический калькулятор
              </span>
              <span className="block bg-clip-text text-transparent">
              </span>

            </h1>
            
            <p className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto" style={{ color: 'var(--foreground-secondary)' }}>
              Решайте сложные математические и статистические задачи с помощью 
              <span className="font-semibold text-indigo-600"> интуитивного интерфейса</span> и 
              <span className="font-semibold text-purple-600"> подробных объяснений</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="gradient-primary text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Link href="/regression" className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Начать работу
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass border-white/20 hover:bg-white/10">
                <Link href="#features" className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Узнать больше
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Возможности платформы
          </h2>
          <p className="text-xl" style={{ color: 'var(--foreground-secondary)' }}>
            Все необходимые инструменты для математического и статистического анализа
          </p>
        </motion.div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div 
                className="h-full p-8 rounded-2xl card-hover"
                style={{ 
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                  {feature.title}
                </h3>
                
                <p className="text-lg mb-6" style={{ color: 'var(--foreground-secondary)' }}>
                  {feature.description}
                </p>
                
                <Button asChild className="w-full group-hover:scale-105 transition-all duration-300">
                  <Link href={feature.href} className="flex items-center justify-center gap-2">
                    Использовать
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20" style={{ background: 'var(--background-tertiary)' }}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Почему выбирают нас
            </h2>
            <p className="text-xl mb-16" style={{ color: 'var(--foreground-secondary)' }}>
              Надежность, точность и удобство в одном решении
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-20 h-20 ${benefit.gradient} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <benefit.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                    {benefit.title}
                  </h3>
                  <p className="text-lg" style={{ color: 'var(--foreground-secondary)' }}>
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Готовы начать расчеты?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Выберите нужный калькулятор и начните работу прямо сейчас
            </p>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl">
              <Link href="/regression" className="flex items-center gap-2">
                Начать работу
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}