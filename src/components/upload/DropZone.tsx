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
      className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition ${
        drop.isDragging
          ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800'
          : 'border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <input {...drop.inputProps} />
      <button
        type="button"
        onClick={disabled ? undefined : drop.open}
        disabled={disabled}
        aria-label={prompt}
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-md bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-50 ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
      >
        {children ?? (
          <>
            <svg
              className="mb-3 h-10 w-10 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              role="presentation"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"
              />
            </svg>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{prompt}</p>
            {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
          </>
        )}
      </button>
    </div>
  );
}
