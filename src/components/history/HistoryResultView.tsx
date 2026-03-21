'use client';

import React from 'react';
import { ClusteringStepsView } from '@/components/clustering/ClusteringStepsView';
import { DendrogramView } from '@/components/clustering/DendrogramView';

const fmt = (v: number, d = 4) => (typeof v === 'number' && !isNaN(v) ? v.toFixed(d) : '—');

export function HistoryResultView({ calc }: { calc: { type: string; input: any; result: any } }) {
  const { type, input, result } = calc;
  if (!result) return <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Нет данных</p>;

  switch (type) {
    case 'anova':
      return <AnovaView result={result} input={input} />;
    case 'regression':
      return <RegressionView result={result} />;
    case 'clustering':
      return <ClusteringView result={result} input={input} />;
    case 'statistics':
      return <StatisticsView result={result} />;
    case 'matrix':
      return <MatrixView result={result} input={input} />;
    case 'derivative':
      return <DerivativeView result={result} />;
    case 'integral':
      return <IntegralView result={result} />;
    case 'graph2d':
    case 'graph3d':
      return <GraphView result={result} input={input} type={type} />;
    case 'scientific':
    case 'photomath':
    case 'engineering':
      return <ScientificView result={result} input={input} type={type} />;
    default:
      return (
        <pre className="p-2 rounded text-xs overflow-x-auto" style={{ background: 'var(--background-tertiary)' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}

function AnovaView({ result }: { result: any; input: any }) {
  const dec = 4;
  const getEffectSizeLabel = (eta: number) => {
    if (eta < 0.01) return 'пренебрежимый';
    if (eta < 0.06) return 'малый';
    if (eta < 0.14) return 'средний';
    return 'большой';
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="p-3 font-bold text-sm" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>Таблица ANOVA</div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--background-secondary)' }}>
              <th className="px-3 py-1.5 text-left font-semibold">Источник</th>
              <th className="px-3 py-1.5 text-right font-semibold">SS</th>
              <th className="px-3 py-1.5 text-right font-semibold">df</th>
              <th className="px-3 py-1.5 text-right font-semibold">MS</th>
              <th className="px-3 py-1.5 text-right font-semibold">F</th>
              <th className="px-3 py-1.5 text-right font-semibold">p</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-3 py-1.5 font-medium">Между группами</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.ssb)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{result.dfBetween ?? '—'}</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.msb)}</td>
              <td className="px-3 py-1.5 text-right font-mono font-bold">{fmt(result.fStatistic)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.pValue, 6)}</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-3 py-1.5 font-medium">Внутри групп</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.ssw)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{result.dfWithin ?? '—'}</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.msw)}</td>
              <td className="px-3 py-1.5 text-right">—</td>
              <td className="px-3 py-1.5 text-right">—</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-3 py-1.5 font-medium">Общая</td>
              <td className="px-3 py-1.5 text-right font-mono">{fmt(result.sst)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{result.dfTotal ?? '—'}</td>
              <td className="px-3 py-1.5 text-right">—</td>
              <td className="px-3 py-1.5 text-right">—</td>
              <td className="px-3 py-1.5 text-right">—</td>
            </tr>
          </tbody>
        </table>
      </div>
      {result.etaSquared != null && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
            <span className="font-medium">η²</span> = {fmt(result.etaSquared)} <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>({getEffectSizeLabel(result.etaSquared)})</span>
          </div>
          {result.omegaSquared != null && (
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
              <span className="font-medium">ω²</span> = {fmt(result.omegaSquared)}
            </div>
          )}
        </div>
      )}
      <div className={`p-3 rounded-lg border-2 text-sm ${result.significant ? 'border-green-500/50' : 'border-amber-500/50'}`} style={{ background: result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}>
        {result.significant ? <strong className="text-green-400">Отклонить H₀</strong> : <strong className="text-amber-400">Не отклонять H₀</strong>}
        {' '}(p = {fmt(result.pValue, 6)})
      </div>
      {result.groupMeans?.length > 0 && (
        <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="p-2 font-bold text-sm" style={{ background: 'var(--background-tertiary)', color: 'var(--gold)' }}>Статистика групп</div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--background-secondary)' }}>
                <th className="px-2 py-1 text-left">Группа</th>
                <th className="px-2 py-1 text-right">n</th>
                <th className="px-2 py-1 text-right">Среднее</th>
                <th className="px-2 py-1 text-right">Стд. откл.</th>
                <th className="px-2 py-1 text-right">Дисперсия</th>
              </tr>
            </thead>
            <tbody>
              {result.groupMeans.map((_: number, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-2 py-1 font-medium">Группа {i + 1}</td>
                  <td className="px-2 py-1 text-right font-mono">{result.groupSizes?.[i] ?? '—'}</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(result.groupMeans[i])}</td>
                  <td className="px-2 py-1 text-right font-mono">{result.groupStdDevs?.[i] != null ? fmt(result.groupStdDevs[i]) : '—'}</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(result.groupVariances?.[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RegressionView({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
        <span className="font-medium" style={{ color: 'var(--foreground-secondary)' }}>Уравнение:</span>
        <p className="font-mono text-sm mt-1" style={{ color: 'var(--foreground)' }}>{result.equation}</p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <div><span className="font-medium">R²</span> = {fmt(result.rSquared)}</div>
        <div>
          <span className="font-medium">Коэффициенты:</span>{' '}
          <span className="font-mono">[{result.coefficients?.map((c: number) => fmt(c)).join(', ')}]</span>
        </div>
      </div>
    </div>
  );
}

function ClusteringView({ result, input }: { result: any; input: any }) {
  const points = input?.points ?? [];
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4 border-2" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
        <div className="space-y-2 text-sm">
          <p><strong>Метод:</strong> {result.method === 'single' ? 'Ближний сосед' : result.method === 'complete' ? 'Дальний сосед' : result.method === 'average' ? 'Средний' : 'K-means'}</p>
          <p><strong>Кластеров:</strong> {result.clusters?.length ?? 0}</p>
          {result.finalDistance != null && <p><strong>Расстояние P:</strong> {result.finalDistance.toFixed(2)}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <span className="font-medium text-sm">Итоговые кластеры:</span>
        <div className="flex flex-wrap gap-2">
          {result.clusters?.map((cluster: number[], i: number) => (
            <div key={i} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'rgba(212,175,55,0.1)' }}>
              S({cluster.map((c: number) => c + 1).join(',')}): [{cluster.map((c: number) => c + 1).join(', ')}]
            </div>
          ))}
        </div>
      </div>
      {result.steps?.length > 0 && points.length > 0 && (
        <div className="mt-4">
          <ClusteringStepsView steps={result.steps} inputPoints={points} />
        </div>
      )}
      {result.dendrogramData && (
        <div className="mt-4">
          <DendrogramView data={result.dendrogramData} width={600} height={300} />
        </div>
      )}
    </div>
  );
}

function StatisticsView({ result }: { result: any }) {
  const metrics = [
    { label: 'Среднее', value: result.mean },
    { label: 'Медиана', value: result.median },
    { label: 'Мода', value: result.mode },
    { label: 'Дисперсия', value: result.variance },
    { label: 'Стд. откл.', value: result.stdDev },
    { label: 'Размах', value: result.range },
    { label: 'Min', value: result.min },
    { label: 'Max', value: result.max },
    { label: 'Q1', value: result.q1 },
    { label: 'Q3', value: result.q3 },
    { label: 'IQR', value: result.iqr },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {metrics.map(({ label, value }) => (
        <div key={label} className="p-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
          <span className="font-medium">{label}:</span>{' '}
          <span className="font-mono">{Array.isArray(value) ? value.join(', ') : fmt(value)}</span>
        </div>
      ))}
    </div>
  );
}

function MatrixView({ result, input }: { result: any; input: any }) {
  const op = input?.operation ?? 'matrix';
  const opNames: Record<string, string> = {
    gauss: 'Метод Гаусса',
    inverse: 'Обратная матрица',
    determinant: 'Определитель',
    transpose: 'Транспонирование',
    scalar: 'Умножение на скаляр',
    power: 'Степень',
    rank: 'Ранг',
    add: 'Сложение',
    subtract: 'Вычитание',
    multiplyMatrices: 'Умножение матриц',
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{opNames[op] || op}</p>
      {result.solution?.length > 0 && (
        <div className="p-3 rounded-lg border font-mono text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
          <strong>Решение:</strong> x = [{result.solution.map((s: any) => typeof s === 'number' ? fmt(s) : String(s)).join(', ')}]
        </div>
      )}
      {result.determinant != null && typeof result.determinant === 'object' && (
        <p className="text-sm">det = {fmt(Number(result.determinant?.determinant ?? result.determinant))}</p>
      )}
      {typeof result.determinant === 'number' && <p className="text-sm">det = {fmt(result.determinant)}</p>}
      {result.rank != null && <p className="text-sm">rank = {result.rank}</p>}
      {result.steps?.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium" style={{ color: 'var(--gold)' }}>Шаги</summary>
          <ul className="mt-2 list-disc list-inside space-y-1" style={{ color: 'var(--foreground-secondary)' }}>
            {result.steps.slice(0, 5).map((s: string, i: number) => (
              <li key={i}>{typeof s === 'string' ? s.slice(0, 80) + (s.length > 80 ? '…' : '') : JSON.stringify(s).slice(0, 80)}</li>
            ))}
            {result.steps.length > 5 && <li>…и ещё {result.steps.length - 5} шагов</li>}
          </ul>
        </details>
      )}
    </div>
  );
}

function DerivativeView({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
        <p className="text-sm"><strong>f(x)</strong> = {result.original}</p>
        <p className="text-sm mt-1"><strong>f&apos;(x)</strong> = {result.derivative || result.simplified}</p>
      </div>
      {result.steps?.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium" style={{ color: 'var(--gold)' }}>Шаги</summary>
          <div className="mt-2 space-y-2">
            {result.steps.map((s: any, i: number) => (
              <div key={i} className="p-2 rounded border" style={{ borderColor: 'var(--border)' }}>
                <p className="font-mono text-xs">{s.expression}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>{s.explanation}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function IntegralView({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background-tertiary)' }}>
        <p className="text-sm"><strong>Результат:</strong> {result.result ?? result.antiderivative ?? result.integral ?? '—'}</p>
      </div>
      {result.steps?.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium" style={{ color: 'var(--gold)' }}>Шаги</summary>
          <ul className="mt-2 list-disc list-inside space-y-1" style={{ color: 'var(--foreground-secondary)' }}>
            {result.steps.slice(0, 8).map((s: any, i: number) => (
              <li key={i}>{typeof s === 'string' ? s : s.step ?? String(s)}</li>
            ))}
            {result.steps.length > 8 && <li>…ещё {result.steps.length - 8} шагов</li>}
          </ul>
        </details>
      )}
    </div>
  );
}

function GraphView({ result, input, type }: { result: any; input: any; type: string }) {
  const expr = input?.expression ?? '—';
  return (
    <div className="space-y-2 text-sm">
      <p><strong>Функция:</strong> {expr}</p>
      {type === 'graph2d' && result?.points?.length > 0 && (
        <p>Точек: {result.points.length}, x ∈ [{result.xMin}, {result.xMax}]</p>
      )}
      {type === 'graph3d' && result?.points?.length > 0 && (
        <p>Точек: {result.points.length}, x ∈ [{result.xMin}, {result.xMax}], y ∈ [{result.yMin}, {result.yMax}]</p>
      )}
    </div>
  );
}

function ScientificView({ result, input, type }: { result: any; input: any; type?: string }) {
  const expr = input?.expression ?? '—';
  const value = result?.value ?? '—';
  if (type === 'engineering') {
    return (
      <div className="space-y-2 text-sm">
        <p><strong>Операция:</strong> {input?.a ?? '—'} {input?.op ?? '—'} {input?.b ?? '—'}</p>
        <p><strong>DEC:</strong> {value} <strong>HEX:</strong> {result?.hex ?? '—'} <strong>BIN:</strong> {result?.bin ?? '—'}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 text-sm">
      <p><strong>Выражение:</strong> {expr}</p>
      <p><strong>Результат:</strong> {value}</p>
    </div>
  );
}
