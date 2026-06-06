import type { ReactNode } from 'react';
import { ErrorMessage } from '../processing/ErrorMessage';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface InfoField {
  label: string;
  value: string;
}

export interface InfoSection {
  title: string;
  fields: ReadonlyArray<InfoField>;
}

export interface InfoPageProps {
  title: string;
  description: string;
  accept: ReadonlyArray<string>;
  status: 'idle' | 'processing' | 'done' | 'error';
  error: string | null;
  sections: ReadonlyArray<InfoSection>;
  emptyMessage: string;
  onFile: (file: File | File[]) => void;
  onReset: () => void;
  footer?: ReactNode;
  meta?: ReactNode;
}

export function InfoPage({
  title,
  description,
  accept,
  status,
  error,
  sections,
  emptyMessage,
  onFile,
  onReset,
  footer,
  meta,
}: InfoPageProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="animate-fade-in space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
        {meta}
      </header>

      {status === 'idle' && <InfoDropZone onFile={onFile} accept={accept} />}

      {status === 'processing' && (
        <Card>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Reading file…</p>
        </Card>
      )}

      {status === 'error' && error && (
        <ErrorMessage error={error} onReset={onReset} title="Could not read this file" />
      )}

      {status === 'done' &&
        (sections.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{emptyMessage}</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={onReset}>
                Choose another file
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <Card key={section.title}>
                <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {section.title}
                </h2>
                <dl className="divide-y divide-white/40 text-sm dark:divide-white/10">
                  {section.fields.map((field, idx) => (
                    <div
                      key={`${section.title}-${idx}-${field.label}`}
                      className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[12rem_1fr] sm:gap-3"
                    >
                      <dt className="text-neutral-500 dark:text-neutral-400">{field.label}</dt>
                      <dd className="break-words font-mono text-neutral-800 dark:text-neutral-200">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
            <div className="flex flex-wrap gap-2">
              {footer}
              <Button variant="secondary" onClick={onReset}>
                Choose another file
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}

interface InfoDropZoneProps {
  accept: ReadonlyArray<string>;
  onFile: (file: File | File[]) => void;
}

function InfoDropZone({ accept, onFile }: InfoDropZoneProps) {
  return <DropZoneSimple accept={accept} onFile={onFile} />;
}

interface DropZoneSimpleProps {
  accept: ReadonlyArray<string>;
  onFile: (file: File | File[]) => void;
}

import { useFileDrop } from '../../hooks/useFileDrop';
import { humanReadableAccept } from '../../lib/utils/fileValidation';

function DropZoneSimple({ accept, onFile }: DropZoneSimpleProps) {
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
      }`}
    >
      <input {...drop.inputProps} />
      <button
        type="button"
        onClick={drop.open}
        aria-label="Drop a file, or click to choose"
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
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
        <p className="text-sm font-semibold text-ink dark:text-ink-inverse">
          Drop a file, or click to choose
        </p>
        <p className="mt-1 text-xs text-ink-muted dark:text-neutral-400">
          {humanReadableAccept(accept)}
        </p>
      </button>
    </div>
  );
}
