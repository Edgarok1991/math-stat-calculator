'use client';

import React, { useEffect, useRef } from 'react';

interface MathTexProps {
  latex: string;
  className?: string;
  display?: boolean;
}

/**
 * Отображает LaTeX через MathJax (должен быть загружен в layout)
 */
export const MathTex: React.FC<MathTexProps> = ({ latex, className = '', display = false }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!latex?.trim()) return;
    const el = ref.current;
    if (!el) return;

    const mathjax = typeof window !== 'undefined' ? (window as any).MathJax : null;
    if (mathjax?.typesetPromise) {
      mathjax.typesetPromise([el]).catch(() => {});
    }
  }, [latex]);

  if (!latex?.trim()) return <span className={className} />;

  const delim = display ? ['\\[', '\\]'] : ['\\(', '\\)'];
  return (
    <span ref={ref} className={className}>
      {`${delim[0]}${latex}${delim[1]}`}
    </span>
  );
};
