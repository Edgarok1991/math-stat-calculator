'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClusteringStep } from '@/types/calculator';

interface ClusteringStepsViewProps {
  steps: ClusteringStep[];
  inputPoints: number[][];
}

export const ClusteringStepsView: React.FC<ClusteringStepsViewProps> = ({ steps, inputPoints }) => {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Пошаговое решение</h3>
      
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card-midnight rounded-lg border-2 p-6 shadow-md" style={{ borderColor: 'var(--border)' }}
        >
          {/* Заголовок шага */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: 'var(--clustering-header-border)' }}>
            <span className="bg-[#D4AF37] text-[#1c1917] text-sm font-bold px-4 py-2 rounded-lg shadow-sm">
              {step.action === 'initialization' ? 'Шаг 0' : `Шаг ${step.step}`}
            </span>
            <h4 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {step.description}
            </h4>
          </div>

          {/* Детальное описание */}
          {step.detailedDescription && (
            <div className="mb-4 p-4 rounded-lg border" style={{ background: 'var(--clustering-info-bg)', borderColor: 'var(--clustering-info-border)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
                {step.detailedDescription}
              </p>
            </div>
          )}

          {/* Информация об объединяемых кластерах */}
          {step.minDistance !== undefined && step.minDistanceIndices && (
            <div className="mb-4 p-3 rounded-lg border" style={{ background: 'var(--clustering-info-bg)', borderColor: 'var(--clustering-info-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                <span className="font-bold" style={{ color: 'var(--gold)' }}>Минимальное расстояние:</span>{' '}
                P<sub>{step.minDistanceIndices[0] + 1},{step.minDistanceIndices[1] + 1}</sub> = {step.minDistance.toFixed(2)}
              </p>
            </div>
          )}

          {/* Матрица расстояний */}
          <div className="mb-4">
            <h5 className="text-md font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Матрица расстояний:
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border-2" style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr className="">
                    <th className="border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }}>
                      № п/п
                    </th>
                    {step.distances[0].map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="border px-3 py-2 text-sm font-semibold"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {step.clusterLabels ? step.clusterLabels[colIndex] : colIndex + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {step.distances.map((row, rowIndex) => (
                    <tr key={rowIndex} style={rowIndex % 2 === 0 ? { background: 'var(--background-tertiary)' } : {}}>
                      <td
                        className="border px-3 py-2 text-sm font-semibold"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {step.clusterLabels ? step.clusterLabels[rowIndex] : rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const isMinDistance =
                          step.minDistanceIndices &&
                          ((rowIndex === step.minDistanceIndices[0] && colIndex === step.minDistanceIndices[1]) ||
                            (rowIndex === step.minDistanceIndices[1] && colIndex === step.minDistanceIndices[0]));
                        
                        const isMergedCluster = step.minDistanceIndices?.includes(rowIndex) || step.minDistanceIndices?.includes(colIndex);

                        return (
                          <td
                            key={colIndex}
                            className="border px-3 py-2 text-sm text-center font-mono"
                            style={{
                              borderColor: 'var(--border)',
                              ...(isMinDistance
                                ? { background: 'var(--clustering-min-bg)', color: 'var(--clustering-min-text)', fontWeight: 'bold' }
                                : isMergedCluster
                                ? { background: 'var(--clustering-merged-bg)' }
                                : cell === 0
                                ? {}
                                : {}),
                            }}
                          >
                            {cell === 0 ? '0' : Number(cell).toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пояснение по формированию новой матрицы */}
          {step.action === 'merge' && step.minDistanceIndices && (
            <div className="mt-4 p-3 rounded-lg border" style={{ background: 'var(--clustering-info-bg)', borderColor: 'var(--clustering-info-border)' }}>
              <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--gold)' }}>При формировании новой матрицы расстояний:</span>{' '}
                выбираем соответствующее значение из расстояний объектов №{step.minDistanceIndices[0] + 1} и №{step.minDistanceIndices[1] + 1}.
              </p>
            </div>
          )}

          {/* Текущие кластеры */}
          <div className="mt-4">
            <h5 className="text-md font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Текущие кластеры ({step.remainingClusters || step.clusters.length}):
            </h5>
            <div className="flex flex-wrap gap-2">
              {step.clusters.map((cluster, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg border-2 text-sm font-medium"
                  style={step.mergedClusters?.includes(i)
                    ? { background: 'var(--clustering-merged-bg)', borderColor: 'var(--clustering-merged-border)', color: 'var(--foreground)' }
                    : { background: 'var(--clustering-info-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  S({cluster.map(idx => idx + 1).join(',')})
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Дополнительная информация о точках */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: steps.length * 0.1 }}
        className="rounded-lg p-6 border-2"
        style={{ background: 'var(--clustering-info-bg)', borderColor: 'var(--border)' }}
      >
        <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Исходные данные:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border-2" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--background-tertiary)' }}>
                <th className="border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }}>
                  № объекта
                </th>
                {inputPoints[0]?.map((_, index) => {
                  const labels = ['x', 'y', 'z', 'w', 'v', 'u'];
                  return (
                    <th key={index} className="border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }}>
                      {labels[index] || `x${index + 1}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {inputPoints.map((point, index) => (
                <tr key={index} style={index % 2 === 0 ? { background: 'var(--background-tertiary)' } : {}}>
                  <td className="border px-4 py-2 text-sm font-semibold text-center" style={{ borderColor: 'var(--border)' }}>
                    {index + 1}
                  </td>
                  {point.map((value, i) => (
                    <td key={i} className="border px-4 py-2 text-sm text-center font-mono" style={{ borderColor: 'var(--border)' }}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
