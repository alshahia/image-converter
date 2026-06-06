import { type ChangeEvent, type KeyboardEvent, useCallback, useId, useRef } from 'react';

export interface RangeValue {
  lo: number;
  hi: number;
}

export interface RangeSliderProps {
  min?: number;
  max: number;
  step?: number;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  ariaLabel?: string;
  id?: string;
}

const HANDLE_SIZE = 28;
const HIT_SIZE = 44;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function RangeSlider({
  min = 0,
  max,
  step = 0.01,
  value,
  onChange,
  ariaLabel = 'Range',
  id,
}: RangeSliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rangeRef = useRef<HTMLDivElement | null>(null);

  const span = max - min;
  const leftPct = span > 0 ? ((value.lo - min) / span) * 100 : 0;
  const rightPct = span > 0 ? ((value.hi - min) / span) * 100 : 0;

  const handleLo = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = clamp(Number(e.target.value), min, value.hi);
      onChange({ lo: next, hi: value.hi });
    },
    [min, value.hi, onChange],
  );

  const handleHi = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = clamp(Number(e.target.value), value.lo, max);
      onChange({ lo: value.lo, hi: next });
    },
    [max, value.lo, onChange],
  );

  const onLoKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onChange({ lo: Math.max(min, value.lo - step), hi: value.hi });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onChange({ lo: Math.min(value.hi, value.lo + step), hi: value.hi });
      }
    },
    [min, step, value.hi, value.lo, onChange],
  );

  const onHiKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onChange({ lo: value.lo, hi: Math.max(value.lo, value.hi - step) });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onChange({ lo: value.lo, hi: Math.min(max, value.hi + step) });
      }
    },
    [max, step, value.hi, value.lo, onChange],
  );

  return (
    <div className="flex w-full flex-col gap-1" ref={rangeRef}>
      <div
        className="relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800"
        style={{ minHeight: HIT_SIZE }}
      >
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
        />
        <input
          id={`${inputId}-lo`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.lo}
          onChange={handleLo}
          onKeyDown={onLoKey}
          aria-label={`${ariaLabel} start`}
          className="range-slider-input absolute top-1/2 z-10 -translate-y-1/2 bg-transparent"
          style={{ width: '100%', height: HANDLE_SIZE, pointerEvents: 'none' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white bg-accent shadow-md"
          style={{
            left: `${leftPct}%`,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
          }}
        />
        <input
          id={`${inputId}-hi`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.hi}
          onChange={handleHi}
          onKeyDown={onHiKey}
          aria-label={`${ariaLabel} end`}
          className="range-slider-input absolute top-1/2 z-10 -translate-y-1/2 bg-transparent"
          style={{ width: '100%', height: HANDLE_SIZE, pointerEvents: 'none' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white bg-accent shadow-md"
          style={{
            left: `${rightPct}%`,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
          }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-xs text-neutral-500">
        <span>{value.lo.toFixed(2)}s</span>
        <span>{value.hi.toFixed(2)}s</span>
      </div>
      <style>{`
        .range-slider-input { -webkit-appearance: none; appearance: none; }
        .range-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: ${HIT_SIZE}px; height: ${HIT_SIZE}px;
          background: transparent; border: none; cursor: grab;
          pointer-events: auto; margin-top: -${(HIT_SIZE - 6) / 2}px;
        }
        .range-slider-input::-moz-range-thumb {
          width: ${HIT_SIZE}px; height: ${HIT_SIZE}px;
          background: transparent; border: none; cursor: grab;
          pointer-events: auto;
        }
        .range-slider-input::-webkit-slider-runnable-track { background: transparent; }
        .range-slider-input::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
}
