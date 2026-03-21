'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { evaluate } from 'mathjs';
import { FlaskConical, Camera, Upload, X, Cpu } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { MathExpression } from '@/components/UI/MathExpression';

type Mode = 'calculator' | 'photomath' | 'engineering';
type EngineeringBase = 'DEC' | 'HEX' | 'BIN' | 'OCT';

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

// Инженерный калькулятор: конвертация и побитовые операции (32-bit unsigned)
function toBase(n: number, base: EngineeringBase): string {
  const u = (n >>> 0); // unsigned 32-bit
  if (base === 'DEC') return String(n);
  if (base === 'HEX') return u.toString(16).toUpperCase();
  if (base === 'BIN') return u.toString(2);
  if (base === 'OCT') return u.toString(8);
  return String(n);
}

function parseBase(s: string, base: EngineeringBase): number | null {
  const t = s.trim().toUpperCase();
  if (!t) return 0;
  try {
    if (base === 'DEC') return parseFloat(t) || parseInt(t, 10) || null;
    if (base === 'HEX') return parseInt(t, 16);
    if (base === 'BIN') return parseInt(t, 2);
    if (base === 'OCT') return parseInt(t, 8);
    return null;
  } catch {
    return null;
  }
}

const ENG_BUTTONS: Record<EngineeringBase, string[]> = {
  DEC: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-'],
  HEX: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
  BIN: ['0', '1'],
  OCT: ['0', '1', '2', '3', '4', '5', '6', '7'],
};

export default function ScientificCalculatorPage() {
  const { token } = useAuth();
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('calculator');
  // Инженерный калькулятор
  const [engBase, setEngBase] = useState<EngineeringBase>('DEC');
  const [engValue, setEngValue] = useState<number>(0);
  const [engDisplay, setEngDisplay] = useState('0');
  const [engPending, setEngPending] = useState<{ value: number; op: string } | null>(null);
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

  const handleEngDigit = (key: string) => {
    const valid = ENG_BUTTONS[engBase].includes(key.toUpperCase());
    if (!valid) return;
    setEngDisplay((d) => {
      const next = (d === '0' && key !== '.' ? '' : d) + key;
      const v = parseBase(next, engBase);
      if (v !== null && !isNaN(v)) setEngValue(v);
      return next;
    });
  };

  const handleEngOp = (op: string) => {
    if (op === 'NOT') {
      const v = ~~engValue;
      const res = (~v) >>> 0;
      setEngValue(res);
      setEngDisplay(toBase(res, engBase));
      setEngPending(null);
      setHistory((h) => [...h.slice(-19), `NOT ${toBase(v, engBase)} = ${toBase(res, engBase)}`]);
      return;
    }
    if (op === '<<' || op === '>>') {
      const v = ~~engValue;
      const res = op === '<<' ? (v << 1) >>> 0 : v >> 1;
      setEngValue(res);
      setEngDisplay(toBase(res, engBase));
      setEngPending(null);
      setHistory((h) => [...h.slice(-19), `${toBase(v, engBase)} ${op} 1 = ${toBase(res, engBase)}`]);
      return;
    }
    setEngPending({ value: ~~engValue, op });
    setEngDisplay('0');
    setEngValue(0);
  };

  const handleEngEquals = () => {
    if (!engPending) return;
    const a = engPending.value;
    const b = ~~engValue;
    let res = 0;
    if (engPending.op === 'AND') res = (a & b) >>> 0;
    else if (engPending.op === 'OR') res = (a | b) >>> 0;
    else if (engPending.op === 'XOR') res = (a ^ b) >>> 0;
    setEngValue(res);
    setEngDisplay(toBase(res, engBase));
    setHistory((h) => [...h.slice(-19), `${toBase(a, engBase)} ${engPending.op} ${toBase(b, engBase)} = ${toBase(res, engBase)}`]);
    setEngPending(null);
    if (token) {
      apiService.saveToHistory(token, {
        type: 'engineering',
        input: { a, b, op: engPending.op, base: engBase },
        result: { value: res, hex: toBase(res, 'HEX'), bin: toBase(res, 'BIN') },
      }).catch(() => {});
    }
  };

  const handleEngClear = () => {
    setEngDisplay('0');
    setEngValue(0);
    setEngPending(null);
  };

  const handleEngBaseChange = (b: EngineeringBase) => {
    setEngBase(b);
    setEngDisplay(toBase(engValue, b));
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
            Научный, инженерный калькулятор, Photo Math — решение по фото
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
          <button
            onClick={() => setMode('engineering')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'engineering'
                ? 'gradient-primary text-[#1c1917]'
                : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
            }`}
          >
            <Cpu className="w-5 h-5" />
            Инженерный
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

        {mode === 'engineering' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="rounded-2xl p-6 card-midnight">
              <div className="flex gap-2 mb-4">
                {(['DEC', 'HEX', 'BIN', 'OCT'] as EngineeringBase[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => handleEngBaseChange(b)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      engBase === b ? 'gradient-primary text-[#1c1917]' : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="mb-4 p-4 rounded-xl min-h-[60px] text-right font-mono text-2xl break-all" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                {engPending && <span className="text-sm opacity-70">{toBase(engPending.value, engBase)} {engPending.op} </span>}
                {engDisplay}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {ENG_BUTTONS[engBase].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleEngDigit(key)}
                    className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleEngClear} className="py-3 rounded-xl border border-red-400/50 text-red-400 hover:bg-red-400/10 font-medium text-sm">C</button>
                <button onClick={() => handleEngOp('AND')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">AND</button>
                <button onClick={() => handleEngOp('OR')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">OR</button>
                <button onClick={() => handleEngOp('XOR')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">XOR</button>
                <button onClick={() => handleEngOp('NOT')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">NOT</button>
                <button onClick={() => handleEngOp('<<')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">&lt;&lt;</button>
                <button onClick={() => handleEngOp('>>')} className="py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium text-sm">&gt;&gt;</button>
                <button onClick={handleEngEquals} className="py-3 col-span-2 rounded-xl gradient-primary text-[#1c1917] font-medium">=</button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Представление числа
              </h3>
              <div className="space-y-2 p-4 rounded-xl" style={{ background: 'var(--background)' }}>
                <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>DEC:</span> <span className="font-mono">{engValue}</span></p>
                <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>HEX:</span> <span className="font-mono">{toBase(engValue, 'HEX')}</span></p>
                <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>BIN:</span> <span className="font-mono break-all">{toBase(engValue, 'BIN')}</span></p>
                <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>OCT:</span> <span className="font-mono">{toBase(engValue, 'OCT')}</span></p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
