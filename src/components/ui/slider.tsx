import { type ChangeEvent, useCallback } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  id,
}: SliderProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <label htmlFor={id} className="font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
          <span className="font-mono text-xs text-neutral-500">{value}</span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:accent-brand-400"
      />
    </div>
  );
}
