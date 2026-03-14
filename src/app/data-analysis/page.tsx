'use client';

import { motion } from 'framer-motion';
import { Brain, BarChart2, ArrowRight, TrendingUp, Layers, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/UI/Button';

const analysisTools = [
  {
    icon: Brain,
    title: 'Кластерный анализ',
    description: 'Иерархическая кластеризация с методами ближнего и дальнего соседа',
    features: [
      'Пошаговые таблицы расстояний',
      'Дендрограмма с визуализацией',
      'Методы: Single, Complete, Average Linkage',
      'K-means кластеризация',
      'Детальные объяснения каждого шага'
    ],
    href: '/clustering',
    gradient: 'gradient-success',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: BarChart2,
    title: 'ANOVA (Дисперсионный анализ)',
    description: 'Однофакторный дисперсионный анализ для сравнения средних значений групп',
    features: [
      'F-статистика и p-значение',
      'Критическое значение',
      'Средние значения по группам',
      'Дисперсии групп',
      'Выводы о значимости различий'
    ],
    href: '/anova',
    gradient: 'gradient-warning',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

const benefits = [
  {
    icon: TrendingUp,
    title: 'Статистическая точность',
    description: 'Высокоточные алгоритмы для надежных результатов',
  },
  {
    icon: Layers,
    title: 'Пошаговое решение',
    description: 'Детальные объяснения каждого этапа анализа',
  },
  {
    icon: Target,
    title: 'Визуализация',
    description: 'Графики, таблицы и дендрограммы для наглядности',
  },
];

export default function DataAnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">Статистический анализ данных</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Анализ данных
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/90">
              Мощные инструменты для кластерного и дисперсионного анализа с 
              <span className="font-semibold"> подробными объяснениями</span> и 
              <span className="font-semibold"> визуализацией</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl">
                <Link href="#tools" className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Выбрать инструмент
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Analysis Tools */}
      <div id="tools" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Инструменты анализа
          </h2>
          <p className="text-xl text-gray-600">
            Выберите метод анализа для ваших данных
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {analysisTools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${tool.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600">
                      {tool.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className={`mb-6 p-4 rounded-lg ${tool.bgColor}`}>
                  <h4 className="font-semibold mb-3 text-gray-900">Возможности:</h4>
                  <ul className="space-y-2">
                    {tool.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`mt-1 ${tool.color}`}>✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button asChild className="w-full group-hover:scale-105 transition-all duration-300">
                  <Link href={tool.href} className="flex items-center justify-center gap-2">
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
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Почему анализ данных
            </h2>
            <p className="text-xl text-gray-600">
              Профессиональные инструменты для точного анализа
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Готовы начать анализ?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Выберите инструмент анализа и получите подробные результаты с визуализацией
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl">
                <Link href="/clustering" className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Кластерный анализ
                </Link>
              </Button>
              <Button size="lg" className="bg-white/10 text-white border-2 border-white hover:bg-white/20 shadow-xl">
                <Link href="/anova" className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" />
                  ANOVA анализ
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
