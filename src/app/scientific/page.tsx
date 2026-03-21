'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { evaluate } from 'mathjs';
import { FlaskConical, Camera, Upload, X } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { MathExpression } from '@/components/UI/MathExpression';

type Mode = 'calculator' | 'photomath';

const SCI_BUTTONS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '(', ')'],
  ['^', 'sqrt(', 'π', 'e'],
  ['sin(', 'cos(', 'tan(', 'log('],
  ['ln(', 'abs(', 'log10(', '='],
];

function normalizeForEval(expr: string): string {
  let s = expr.replace(/π/g, 'pi');
  s = s.replace(/√(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  s = s.replace(/√\(/g, 'sqrt(');
  return s;
}

function safeEval(expr: string): string | null {
  try {
    const normalized = normalizeForEval(expr);
    const result = evaluate(normalized);
    return String(typeof result === 'number' && !Number.isNaN(result) ? result : result);
  } catch {
    return null;
  }
}

export default function ScientificCalculatorPage() {
  const { token } = useAuth();
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('calculator');
  const [photoExpression, setPhotoExpression] = useState('');
  const [photoResult, setPhotoResult] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButton = useCallback(
    (key: string) => {
      if (key === 'C') {
        setDisplay('0');
        return;
      }
      if (key === '⌫') {
        setDisplay((d) => (d.length <= 1 ? '0' : d.slice(0, -1)));
        return;
      }
      if (key === '=') {
        const result = safeEval(display);
        if (result !== null) {
          setHistory((h) => [...h.slice(-19), `${display} = ${result}`]);
          setDisplay(result);
          if (token) {
            apiService.saveToHistory(token, {
              type: 'scientific',
              input: { expression: display },
              result: { value: result },
            }).catch(() => {});
          }
        } else {
          setDisplay('Error');
          setTimeout(() => setDisplay('0'), 1500);
        }
        return;
      }
      setDisplay((d) => {
        if (d === '0' || d === 'Error') return key;
        return d + key;
      });
    },
    [display, token]
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setPhotoResult(null);
    setPhotoExpression('');
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoLoading(true);
    try {
      const worker = await createWorker('rus+eng', 1, {
        logger: () => {},
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      let text = data.text.replace(/\s+/g, ' ').trim();
      text = text
        .replace(/х/g, 'x')
        .replace(/Х/g, 'X')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/—/g, '-')
        .replace(/–/g, '-');
      setPhotoExpression(text);
      const normalized = normalizeForEval(text);
      const result = safeEval(normalized);
      setPhotoResult(result);
      if (result && token) {
        apiService.saveToHistory(token, {
          type: 'photomath',
          input: { expression: text, source: 'image' },
          result: { value: result },
        }).catch(() => {});
      }
      if (!result && text) setPhotoError('Не удалось вычислить выражение. Отредактируйте текст вручную.');
    } catch (err) {
      setPhotoError('Ошибка распознавания. Попробуйте другое фото.');
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const evaluatePhotoExpression = () => {
    if (!photoExpression.trim()) return;
    const result = safeEval(photoExpression);
    setPhotoResult(result);
    if (result && token) {
      apiService.saveToHistory(token, {
        type: 'photomath',
        input: { expression: photoExpression },
        result: { value: result },
      }).catch(() => {});
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoExpression('');
    setPhotoResult(null);
    setPhotoError('');
  };

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Научный калькулятор
          </h1>
          <p style={{ color: 'var(--foreground-secondary)' }}>
            Калькулятор с тригонометрией, логарифмами и Photo Math — решение по фото
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('calculator')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'calculator'
                ? 'gradient-primary text-[#1c1917]'
                : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
            }`}
          >
            <FlaskConical className="w-5 h-5" />
            Калькулятор
          </button>
          <button
            onClick={() => setMode('photomath')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'photomath'
                ? 'gradient-primary text-[#1c1917]'
                : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
            }`}
          >
            <Camera className="w-5 h-5" />
            Photo Math
          </button>
        </div>

        {mode === 'calculator' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="rounded-2xl p-6 card-midnight">
              <div className="mb-4 p-4 rounded-xl min-h-[60px] text-right font-mono text-2xl break-all" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                {display}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SCI_BUTTONS.flat().map((key) => (
                  <button
                    key={key}
                    onClick={() => handleButton(key)}
                    className={`py-4 rounded-xl font-medium transition-all text-sm ${
                      key === '=' ? 'col-span-2 gradient-primary text-[#1c1917]' : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                История
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    История пуста
                  </p>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((item, i) => (
                      <div key={i} className="p-3 rounded-lg font-mono text-sm" style={{ background: 'var(--background)' }}>
                        <MathExpression expression={item} />
                      </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'photomath' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-6 card-midnight space-y-6"
          >
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-[#1c1917] font-medium disabled:opacity-60"
              >
                <Upload className="w-5 h-5" />
                {photoLoading ? 'Распознавание...' : 'Загрузить фото'}
              </button>
              {photoPreview && (
                <button
                  onClick={clearPhoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-400/50 text-red-400 hover:bg-red-400/10"
                >
                  <X className="w-4 h-4" />
                  Очистить
                </button>
              )}
            </div>

            {photoPreview && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                    Изображение
                  </p>
                  <img
                    src={photoPreview}
                    alt="Upload"
                    className="w-full max-h-64 object-contain rounded-xl border"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Распознанный текст (можно редактировать)
                    </label>
                    <textarea
                      value={photoExpression}
                      onChange={(e) => setPhotoExpression(e.target.value)}
                      placeholder="2 + 3 * 4 или sin(30)"
                      className="w-full px-4 py-3 rounded-xl border font-mono"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      rows={3}
                    />
                    <button
                      onClick={evaluatePhotoExpression}
                      className="mt-2 px-4 py-2 rounded-xl gradient-primary text-[#1c1917] font-medium"
                    >
                      Вычислить
                    </button>
                  </div>
                  {photoResult && (
                    <div className="p-4 rounded-xl" style={{ background: 'var(--background)' }}>
                      <span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                        Результат:{' '}
                      </span>
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        <MathExpression expression={photoResult} />
                      </span>
                    </div>
                  )}
                  {photoError && <p className="text-sm text-red-400">{photoError}</p>}
                </div>
              </div>
            )}

            {!photoPreview && (
              <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-40" style={{ color: 'var(--foreground-secondary)' }} />
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Photo Math
                </p>
                <p style={{ color: 'var(--foreground-secondary)' }}>
                  Сфотографируйте или загрузите изображение с математическим выражением. Поддерживаются простые примеры: 2+3*4, sin(30), √16
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
