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
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Пошаговое решение</h3>
      
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-md"
        >
          {/* Заголовок шага */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-100">
            <span className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm">
              {step.action === 'initialization' ? 'Шаг 0' : `Шаг ${step.step}`}
            </span>
            <h4 className="text-lg font-semibold text-gray-800">
              {step.description}
            </h4>
          </div>

          {/* Детальное описание */}
          {step.detailedDescription && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {step.detailedDescription}
              </p>
            </div>
          )}

          {/* Информация об объединяемых кластерах */}
          {step.minDistance !== undefined && step.minDistanceIndices && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-gray-800">
                <span className="font-bold text-yellow-800">Минимальное расстояние:</span>{' '}
                P<sub>{step.minDistanceIndices[0] + 1},{step.minDistanceIndices[1] + 1}</sub> = {step.minDistance.toFixed(4)}
              </p>
            </div>
          )}

          {/* Матрица расстояний */}
          <div className="mb-4">
            <h5 className="text-md font-semibold text-gray-700 mb-3">
              Матрица расстояний:
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border-2 border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700">
                      № п/п
                    </th>
                    {step.distances[0].map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className={`border border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 ${
                          step.minDistanceIndices?.includes(colIndex) ? 'bg-yellow-100' : ''
                        }`}
                      >
                        {step.clusterLabels ? step.clusterLabels[colIndex] : colIndex + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {step.distances.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td
                        className={`border border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 ${
                          step.minDistanceIndices?.includes(rowIndex) ? 'bg-yellow-100' : 'bg-gray-100'
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
                            className={`border border-gray-400 px-3 py-2 text-sm text-center font-mono ${
                              isMinDistance
                                ? 'bg-red-200 font-bold text-red-900'
                                : isMergedCluster
                                ? 'bg-yellow-50'
                                : cell === 0
                                ? 'bg-gray-100 text-gray-400'
                                : 'text-gray-700'
                            }`}
                          >
                            {cell === 0 ? '0' : cell.toFixed(2)}
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
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-green-800">При формировании новой матрицы расстояний:</span>{' '}
                выбираем соответствующее значение из расстояний объектов №{step.minDistanceIndices[0] + 1} и №{step.minDistanceIndices[1] + 1}.
              </p>
            </div>
          )}

          {/* Текущие кластеры */}
          <div className="mt-4">
            <h5 className="text-md font-semibold text-gray-700 mb-3">
              Текущие кластеры ({step.remainingClusters || step.clusters.length}):
            </h5>
            <div className="flex flex-wrap gap-2">
              {step.clusters.map((cluster, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                    step.mergedClusters?.includes(i)
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-900'
                      : 'bg-blue-50 border-blue-300 text-blue-900'
                  }`}
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
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Исходные данные:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border-2 border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
                  № объекта
                </th>
                {inputPoints[0]?.map((_, index) => {
                  const labels = ['x', 'y', 'z', 'w', 'v', 'u'];
                  return (
                    <th key={index} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
                      {labels[index] || `x${index + 1}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {inputPoints.map((point, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-center bg-gray-100">
                    {index + 1}
                  </td>
                  {point.map((value, i) => (
                    <td key={i} className="border border-gray-300 px-4 py-2 text-sm text-center font-mono">
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
