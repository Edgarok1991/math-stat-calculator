import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { MobXProvider } from '@/providers/MobXProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MathCalc: Midnight Blue Edition - Математический и Статистический Калькулятор',
  description: 'Премиальное приложение для математических и статистических расчетов',
  keywords: 'математика, статистика, калькулятор, регрессия, кластеризация, ANOVA, матрицы, производные, интегралы',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <script id="mathjax-config" type="text/x-mathjax-config">
          {`
            MathJax = {
              tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
              svg: { fontCache: 'global' }
            };
          `}
        </script>
        <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
        <ThemeProvider>
          <AuthProvider>
            <MobXProvider>
              <div className="min-h-screen flex flex-col relative z-10">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </MobXProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}