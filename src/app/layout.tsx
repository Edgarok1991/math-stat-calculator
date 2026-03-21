import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { MobXProvider } from '@/providers/MobXProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

/** Типографика: Raleway Light 300 (Google Fonts) */
const raleway = Raleway({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-raleway',
});

export const metadata: Metadata = {
  title: 'MathCalc — Математический и статистический калькулятор',
  description: 'Премиальное приложение для математических и статистических расчётов',
  keywords: 'математика, статистика, калькулятор, регрессия, кластеризация, ANOVA, матрицы, производные, интегралы',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#141210' },
    { media: '(prefers-color-scheme: light)', color: '#faf6ef' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${raleway.variable} ${raleway.className}`}>
      <body>
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
              <div className="min-h-screen flex flex-col relative z-10 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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