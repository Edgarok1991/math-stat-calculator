'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Динамический импорт для избежания SSR проблем
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка графика...</p>
      </div>
    </div>
  )
});

export const PlotlyChart = Plot;

