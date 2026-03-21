'use client';

import React, { useEffect, useRef } from 'react';
import { DendrogramNode } from '@/types/calculator';
import { useTheme } from '@/contexts/ThemeContext';

interface DendrogramViewProps {
  data: DendrogramNode;
  width?: number;
  height?: number;
}

export const DendrogramView: React.FC<DendrogramViewProps> = ({ 
  data, 
  width = 800, 
  height = 400 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Цвета из темы (адаптивные под светлую/тёмную)
    const styles = getComputedStyle(document.documentElement);
    const lineColor = styles.getPropertyValue('--gold').trim() || '#d4af37';
    const textColor = styles.getPropertyValue('--foreground').trim() || '#f5ebe0';
    const accentColor = styles.getPropertyValue('--clustering-min-text').trim() || styles.getPropertyValue('--luxury-error').trim() || '#e8b4b4';
    const axisColor = styles.getPropertyValue('--foreground-muted').trim() || '#9a8b75';

    // Очистка canvas
    ctx.clearRect(0, 0, width, height);

    // Настройки отрисовки
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Подсчет количества листьев для позиционирования по оси X
    const countLeaves = (node: DendrogramNode): number => {
      if (!node.children || node.children.length === 0) return 1;
      return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
    };

    const totalLeaves = countLeaves(data);

    // Нахождение максимальной высоты для масштабирования по оси Y
    const findMaxHeight = (node: DendrogramNode): number => {
      if (!node.children || node.children.length === 0) return 0;
      const childHeights = node.children.map(child => findMaxHeight(child));
      return Math.max(node.height || 0, ...childHeights);
    };

    const maxHeight = findMaxHeight(data);

    // Функция отрисовки дерева
    let currentLeafX = 0;

    const drawNode = (
      node: DendrogramNode,
      x: number,
      y: number,
      parentY: number | null
    ): number => {
      const nodeY = margin.top + plotHeight - (node.height || 0) / maxHeight * plotHeight;

      if (!node.children || node.children.length === 0) {
        // Листовой узел
        const leafX = margin.left + (currentLeafX / totalLeaves) * plotWidth;
        currentLeafX++;

        // Вертикальная линия к родителю
        if (parentY !== null) {
          ctx.beginPath();
          ctx.moveTo(leafX, nodeY);
          ctx.lineTo(leafX, parentY);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Название листа
        ctx.save();
        ctx.translate(leafX, height - margin.bottom + 5);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = textColor;
        ctx.font = '12px sans-serif';
        ctx.fillText(node.name, 0, 0);
        ctx.restore();

        return leafX;
      }

      // Внутренний узел
      const childPositions: number[] = [];
      
      for (const child of node.children) {
        const childX = drawNode(child, x, y, nodeY);
        childPositions.push(childX);
      }

      // Вычисляем X позицию как среднее детей
      const nodeX = childPositions.reduce((sum, pos) => sum + pos, 0) / childPositions.length;

      // Горизонтальная линия между детьми
      if (childPositions.length > 1) {
        ctx.beginPath();
        ctx.moveTo(childPositions[0], nodeY);
        ctx.lineTo(childPositions[childPositions.length - 1], nodeY);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Вертикальная линия к родителю
      if (parentY !== null) {
        ctx.beginPath();
        ctx.moveTo(nodeX, nodeY);
        ctx.lineTo(nodeX, parentY);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Метка расстояния
      if (node.distance !== undefined) {
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(Number(node.distance).toFixed(2), nodeX + 5, nodeY - 5);
      }

      return nodeX;
    };

    // Отрисовка осей
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Подписи осей
    ctx.fillStyle = axisColor;
    ctx.font = '14px sans-serif';
    ctx.fillText('Расстояние', 10, margin.top + plotHeight / 2);
    ctx.fillText('Объекты', width / 2 - 30, height - 10);

    // Деления на оси Y
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const tickValue = (maxHeight / numTicks) * i;
      const tickY = margin.top + plotHeight - (tickValue / maxHeight) * plotHeight;
      
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, tickY);
      ctx.lineTo(margin.left, tickY);
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = axisColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Number(tickValue).toFixed(2), margin.left - 10, tickY + 4);
    }
    ctx.textAlign = 'left';

    // Отрисовка дендрограммы
    currentLeafX = 0;
    drawNode(data, width / 2, margin.top, null);

  }, [data, width, height, theme]);

  return (
    <div className="p-6 rounded-lg border-2 shadow-md card-midnight" style={{ borderColor: 'var(--border)' }}>
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Дендрограмма</h3>
      <div className="overflow-x-auto">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border rounded" style={{ borderColor: 'var(--border)' }}
        />
      </div>
      <p className="text-sm mt-3" style={{ color: 'var(--foreground-secondary)' }}>
        Дендрограмма показывает иерархическую структуру объединения кластеров. 
        Красные числа показывают расстояние на момент объединения.
      </p>
    </div>
  );
};
