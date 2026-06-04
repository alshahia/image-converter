import type { ReactNode } from 'react';
import { useFileDrop } from '../../hooks/useFileDrop';

export interface DropZoneProps {
  accept: ReadonlyArray<string>;
  onFile: (file: File | File[]) => void;
  prompt?: string;
  hint?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function DropZone({
  accept,
  onFile,
  prompt = 'Drop a file, or click to choose',
  hint,
  disabled = false,
  children,
}: DropZoneProps) {
  const drop = useFileDrop({ accept, onFile });

  return (
    <div
      onDragOver={drop.onDragOver}
      onDragEnter={drop.onDragEnter}
      onDragLeave={drop.onDragLeave}
      onDrop={drop.onDrop}
      className={`group relative flex w-full flex-col items-center justify-center rounded-glass-sm border-2 border-dashed p-8 text-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-glass-sm sm:p-10 ${
        drop.isDragging
          ? 'border-accent bg-glass-strong shadow-drift-card-hover dark:border-accent dark:bg-white/[0.08]'
          : 'border-accent/30 bg-glass-soft shadow-glass-sm hover:border-accent/60 hover:bg-glass-strong dark:border-accent/30 dark:bg-white/[0.04] dark:hover:border-accent/70 dark:hover:bg-white/[0.06]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...drop.inputProps} />
      <button
        type="button"
        onClick={disabled ? undefined : drop.open}
        disabled={disabled}
        aria-label={prompt}
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
      >
        {children ?? (
          <>
            <span
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-drift-card transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                drop.isDragging
                  ? 'scale-110 bg-accent-soft text-accent-strong dark:bg-accent/30 dark:text-white'
                  : 'bg-drift-pink/60 text-accent-strong group-hover:bg-drift-pink group-hover:scale-105 dark:bg-accent/15 dark:text-accent-soft dark:group-hover:bg-accent/25'
              }`}
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  drop.isDragging ? '-translate-y-1' : 'group-hover:-translate-y-0.5'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"
                />
              </svg>
            </span>
            <p className="text-sm font-semibold text-ink dark:text-ink-inverse">{prompt}</p>
            {hint && <p className="mt-1 text-xs text-ink-muted dark:text-neutral-400">{hint}</p>}
          </>
        )}
      </button>
    </div>
  );
}
