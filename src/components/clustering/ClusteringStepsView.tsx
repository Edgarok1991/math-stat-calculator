'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClusteringStep } from '@/types/calculator';
import { FractionDisplay } from '@/components/UI';

interface ClusteringStepsViewProps {
  steps: ClusteringStep[];
  inputPoints: number[][];
}

export const ClusteringStepsView: React.FC<ClusteringStepsViewProps> = ({ steps, inputPoints }) => {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold  mb-6">Пошаговое решение</h3>
      
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card-midnight rounded-lg border-2 p-6 shadow-md" style={{ borderColor: 'var(--border)' }}
        >
          {/* Заголовок шага */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-100">
            <span className="bg-[#D4AF37] text-[#1c1917] text-sm font-bold px-4 py-2 rounded-lg shadow-sm">
              {step.action === 'initialization' ? 'Шаг 0' : `Шаг ${step.step}`}
            </span>
            <h4 className="text-lg font-semibold ">
              {step.description}
            </h4>
          </div>

          {/* Детальное описание */}
          {step.detailedDescription && (
            <div className="mb-4 p-4 bg-[rgba(212,175,55,0.06)] rounded-lg border ">
              <p className="text-sm  leading-relaxed">
                {step.detailedDescription}
              </p>
            </div>
          )}

          {/* Информация об объединяемых кластерах */}
          {step.minDistance !== undefined && step.minDistanceIndices && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium ">
                <span className="font-bold text-yellow-800">Минимальное расстояние:</span>{' '}
                P<sub>{step.minDistanceIndices[0] + 1},{step.minDistanceIndices[1] + 1}</sub> = <FractionDisplay value={step.minDistance} />
              </p>
            </div>
          )}

          {/* Матрица расстояний */}
          <div className="mb-4">
            <h5 className="text-md font-semibold  mb-3">
              Матрица расстояний:
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border-2 ">
                <thead>
                  <tr className="">
                    <th className="border  px-3 py-2 text-sm font-semibold ">
                      № п/п
                    </th>
                    {step.distances[0].map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className={`border  px-3 py-2 text-sm font-semibold  ${
                          step.minDistanceIndices?.includes(colIndex) ? '' : ''
                        }`}
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
                        className={`border  px-3 py-2 text-sm font-semibold  ${
                          step.minDistanceIndices?.includes(rowIndex) ? '' : ''
                        }`}
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
                            className={`border  px-3 py-2 text-sm text-center font-mono ${
                              isMinDistance
                                ? 'bg-red-200 font-bold text-[#5c3d3d]'
                                : isMergedCluster
                                ? 'bg-yellow-50'
                                : cell === 0
                                ? ' '
                                : ''
                            }`}
                          >
                            {cell === 0 ? '0' : <FractionDisplay value={cell} />}
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
            <div className="mt-4 p-3 bg-[rgba(212,175,55,0.08)] rounded-lg border border-[#D4AF37]/25">
              <p className="text-sm ">
                <span className="font-semibold text-[#e8dcc8]">При формировании новой матрицы расстояний:</span>{' '}
                выбираем соответствующее значение из расстояний объектов №{step.minDistanceIndices[0] + 1} и №{step.minDistanceIndices[1] + 1}.
              </p>
            </div>
          )}

          {/* Текущие кластеры */}
          <div className="mt-4">
            <h5 className="text-md font-semibold  mb-3">
              Текущие кластеры ({step.remainingClusters || step.clusters.length}):
            </h5>
            <div className="flex flex-wrap gap-2">
              {step.clusters.map((cluster, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                    step.mergedClusters?.includes(i)
                      ? ' border-yellow-400 text-yellow-300'
                      : ''
                  }`}
                  style={!step.mergedClusters?.includes(i) ? { background: 'rgba(212,175,55,0.15)', borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
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
        className="rounded-lg p-6 border-2" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}
      >
        <h4 className="text-lg font-semibold  mb-3">Исходные данные:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border-2 ">
            <thead>
              <tr style={{ background: 'rgba(212,175,55,0.2)' }}>
                <th className="border  px-4 py-2 text-sm font-semibold ">
                  № объекта
                </th>
                {inputPoints[0]?.map((_, index) => {
                  const labels = ['x', 'y', 'z', 'w', 'v', 'u'];
                  return (
                    <th key={index} className="border  px-4 py-2 text-sm font-semibold ">
                      {labels[index] || `x${index + 1}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {inputPoints.map((point, index) => (
                <tr key={index} style={index % 2 === 0 ? { background: 'var(--background-tertiary)' } : {}}>
                  <td className="border  px-4 py-2 text-sm font-semibold text-center ">
                    {index + 1}
                  </td>
                  {point.map((value, i) => (
                    <td key={i} className="border  px-4 py-2 text-sm text-center font-mono">
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
