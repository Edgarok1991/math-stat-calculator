'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { evaluate } from 'mathjs';
import { FlaskConical, Camera, Upload, X, Cpu } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { MathExpression } from '@/components/UI/MathExpression';
import { solveComplex, SolveResult } from '@/lib/photomathSolver';

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
  const [photoResult, setPhotoResult] = useState<SolveResult | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState(false);

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

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string) || '');
      r.onerror = rej;
      r.readAsDataURL(blob);
    });

  const processImageAndSolve = async (file: File | Blob) => {
    setPhotoError('');
    setPhotoResult(null);
    const dataUrl = await blobToBase64(file);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    setPhotoPreview(dataUrl);
    setPhotoLoading(true);
    let text = '';
    try {
      try {
        const ocrRes = await apiService.photomathOcr(base64);
        if (ocrRes?.text) text = ocrRes.text;
      } catch {
        // Backend недоступен или Mathpix ошибка — fallback на Tesseract
      }
      if (!text) {
        const worker = await createWorker('rus+eng', 1, { logger: () => {} });
        const { data } = await worker.recognize(file as File);
        await worker.terminate();
        text = data.text.replace(/\s+/g, ' ').trim();
      }
      text = text
        .replace(/х/g, 'x')
        .replace(/Х/g, 'X')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/—/g, '-')
        .replace(/–/g, '-');
      setPhotoExpression(text);
      const result = await solveComplex(text, {
        derivative: (d) => apiService.calculateDerivativeDetailed(d),
        integral: (d) => apiService.calculateIntegral(d),
      });
      setPhotoResult(result);
      if (result.type !== 'error' && token) {
        const payload: any = { type: 'photomath', input: { expression: text }, result: {} };
        if (result.type === 'arithmetic') payload.result = { value: result.value };
        else if (result.type === 'derivative') payload.result = result.result;
        else if (result.type === 'integral') payload.result = result.result;
        apiService.saveToHistory(token, payload).catch(() => {});
      }
      if (result.type === 'error' && text) setPhotoError(result.message + ' Отредактируйте выражение и нажмите «Вычислить».');
    } catch (err) {
      setPhotoError('Ошибка распознавания. Попробуйте другое фото или введите выражение вручную.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageAndSolve(file);
    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraMode(true);
    } catch {
      setPhotoError('Не удалось получить доступ к камере.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraMode(false);
  };

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(async (blob) => {
      if (blob) {
        stopCamera();
        await processImageAndSolve(blob);
      }
    }, 'image/jpeg', 0.9);
  }, []);

  useEffect(() => () => stopCamera(), []);

  const evaluatePhotoExpression = async () => {
    if (!photoExpression.trim()) return;
    setPhotoError('');
    setPhotoLoading(true);
    try {
      const result = await solveComplex(photoExpression, {
        derivative: (d) => apiService.calculateDerivativeDetailed(d),
        integral: (d) => apiService.calculateIntegral(d),
      });
      setPhotoResult(result);
      if (result.type !== 'error' && token) {
        const payload: any = { type: 'photomath', input: { expression: photoExpression }, result: {} };
        if (result.type === 'arithmetic') payload.result = { value: result.value };
        else if (result.type === 'derivative') payload.result = result.result;
        else if (result.type === 'integral') payload.result = result.result;
        apiService.saveToHistory(token, payload).catch(() => {});
      }
      if (result.type === 'error') setPhotoError(result.message);
    } catch {
      setPhotoError('Не удалось вычислить.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const clearPhoto = () => {
    stopCamera();
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
            Калькулятор
          </h1>
          <p style={{ color: 'var(--foreground-secondary)' }}>
            Калькулятор, инженерный режим, Photo Math — решение по фото
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
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex flex-wrap items-center gap-3">
              {!cameraMode ? (
                <>
                  <button
                    onClick={startCamera}
                    disabled={photoLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-[#1c1917] font-medium disabled:opacity-60"
                  >
                    <Camera className="w-5 h-5" />
                    Сфотографировать
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium disabled:opacity-60"
                  >
                    <Upload className="w-5 h-5" />
                    Загрузить фото
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative w-full max-w-md rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                    <button
                      onClick={captureFromCamera}
                      disabled={photoLoading}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg disabled:opacity-60"
                    >
                      <Camera className="w-8 h-8 text-[#1c1917]" />
                    </button>
                  </div>
                  <button onClick={stopCamera} className="px-4 py-2 rounded-xl border border-red-400/50 text-red-400 hover:bg-red-400/10">
                    Отмена
                  </button>
                </div>
              )}
              {photoPreview && !cameraMode && (
                <button onClick={clearPhoto} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-400/50 text-red-400 hover:bg-red-400/10">
                  <X className="w-4 h-4" />
                  Очистить
                </button>
              )}
            </div>

            {photoPreview && !cameraMode && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>Изображение</p>
                  <img src={photoPreview} alt="Upload" className="w-full max-h-64 object-contain rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                      Распознанный текст (можно редактировать)
                    </label>
                    <textarea
                      value={photoExpression}
                      onChange={(e) => setPhotoExpression(e.target.value)}
                      placeholder="2+3*4, sin(pi/6), ∫x^2 dx, d/dx(x^2)"
                      className="w-full px-4 py-3 rounded-xl border font-mono text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      rows={3}
                    />
                    <button onClick={evaluatePhotoExpression} disabled={photoLoading} className="mt-2 px-4 py-2 rounded-xl gradient-primary text-[#1c1917] font-medium disabled:opacity-60">
                      {photoLoading ? 'Вычисление...' : 'Вычислить'}
                    </button>
                  </div>
                  {photoResult && photoResult.type !== 'error' && (
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--background)' }}>
                      {photoResult.type === 'arithmetic' && (
                        <>
                          <span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Результат: </span>
                          <span className="text-2xl font-bold text-[#D4AF37]"><MathExpression expression={photoResult.value} /></span>
                        </>
                      )}
                      {photoResult.type === 'derivative' && (
                        <div className="space-y-2">
                          <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Производная: </span>
                            <span className="font-bold text-[#D4AF37]"><MathExpression expression={photoResult.result.simplified || photoResult.result.derivative} /></span></p>
                          {photoResult.steps?.slice(0, 4).map((s: any, i: number) => (
                            <p key={i} className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                              {s.explanation || s.expression}
                            </p>
                          ))}
                        </div>
                      )}
                      {photoResult.type === 'integral' && (
                        <div className="space-y-2">
                          <p><span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Результат: </span>
                            <span className="font-bold text-[#D4AF37]"><MathExpression expression={photoResult.result.result || photoResult.result.integral || photoResult.result.antiderivative} /></span></p>
                          {photoResult.steps?.slice(0, 4).map((s: any, i: number) => (
                            <p key={i} className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>
                              {typeof s === 'string' ? s : s.step ?? String(s)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {photoError && <p className="text-sm text-red-400">{photoError}</p>}
                </div>
              </div>
            )}

            {!photoPreview && !cameraMode && (
              <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-40" style={{ color: 'var(--foreground-secondary)' }} />
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Photo Math</p>
                <p style={{ color: 'var(--foreground-secondary)' }}>
                  Сфотографируйте или загрузите пример. Поддержка: арифметика (2+3*4, sin(π/6)), производные (d/dx x^2), интегралы (∫x²dx)
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
