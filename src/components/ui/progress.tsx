export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
}

export function Progress({ value, max = 100, label }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
          <span className="font-mono text-xs text-neutral-500">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        tabIndex={0}
      >
        <div
          className="h-full bg-neutral-900 transition-all duration-200 dark:bg-neutral-50"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
