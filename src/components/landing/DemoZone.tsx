import { type ChangeEvent, type DragEvent, useCallback, useEffect, useRef, useState } from 'react';

export type DemoZoneProps = Record<string, never>;

type Phase = 'idle' | 'processing' | 'result' | 'error';

interface ResultState {
  readonly originalUrl: string;
  readonly resultUrl: string;
  readonly resultBlob: Blob;
  readonly originalSize: number;
  readonly resultSize: number;
  readonly originalName: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

function toWebpName(name: string): string {
  const dot = name.lastIndexOf('.');
  return `${dot > 0 ? name.slice(0, dot) : name}.webp`;
}

export function DemoZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);
  const dragCounter = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const trackUrl = useCallback((url: string): string => {
    urlsRef.current.push(url);
    return url;
  }, []);

  const revokeAll = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please choose an image file (PNG, JPG, WebP, or HEIC).');
        setPhase('error');
        return;
      }

      revokeAll();
      setResult(null);
      setErrorMessage('');
      setPhase('processing');

      try {
        const originalUrl = trackUrl(URL.createObjectURL(file));

        const img = new Image();
        img.decoding = 'async';
        img.src = originalUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('That image could not be decoded.'));
        });

        const width = img.naturalWidth;
        const height = img.naturalHeight;
        if (width === 0 || height === 0) {
          throw new Error('That image has no visible pixels.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas is not available in this browser.');
        }
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/webp', 0.85);
        });
        if (!blob) {
          throw new Error('WebP encoding is not supported by this browser.');
        }

        const resultUrl = trackUrl(URL.createObjectURL(blob));
        setResult({
          originalUrl,
          resultUrl,
          resultBlob: blob,
          originalSize: file.size,
          resultSize: blob.size,
          originalName: file.name,
        });
        setPhase('result');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong while converting.';
        setErrorMessage(message);
        setPhase('error');
      }
    },
    [revokeAll, trackUrl],
  );

  const reset = useCallback(() => {
    revokeAll();
    setResult(null);
    setErrorMessage('');
    setPhase('idle');
    if (inputRef.current) inputRef.current.value = '';
  }, [revokeAll]);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = '';
    },
    [processFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragEnter = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.resultUrl;
    a.download = toWebpName(result.originalName);
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [result]);

  const reductionPct = result
    ? Math.max(0, Math.round((1 - result.resultSize / result.originalSize) * 100))
    : 0;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-ink">Try it now</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Drop a photo — we'll convert it to WebP in your browser. No upload.
      </p>

      {phase === 'idle' && (
        <label
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ease-out-expo focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
            isDragging
              ? 'scale-[1.02] border-accent bg-white/40'
              : 'border-white/70 hover:bg-white/20'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            aria-label="Choose a photo from your device"
            className="sr-only"
          />
          <svg
            aria-hidden="true"
            className={`mb-3 h-8 w-8 text-ink-muted transition-transform duration-200 ${
              isDragging ? '-translate-y-1' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"
            />
          </svg>
          <p className="text-sm font-medium text-ink">Drag a photo here</p>
          <p className="mt-1 text-xs text-ink-muted">PNG, JPG, WebP, HEIC — anything</p>
          <span className="btn-glass pointer-events-none mt-4">Choose a photo</span>
        </label>
      )}

      {phase === 'processing' && (
        <div
          aria-live="polite"
          className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/70 p-8"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4 animate-spin text-ink-muted"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 1-9 9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 text-sm text-ink-muted">Converting…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <img
                src={result.originalUrl}
                alt={`Original ${result.originalName}, ${formatBytes(result.originalSize)}`}
                className="max-h-32 max-w-32 rounded-lg object-contain"
              />
              <span className="mt-2 text-xs text-ink-muted">
                Original · {formatBytes(result.originalSize)}
              </span>
            </div>
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-ink-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            <div className="flex flex-col items-center">
              <img
                src={result.resultUrl}
                alt={`WebP result, ${formatBytes(result.resultSize)}`}
                className="max-h-32 max-w-32 rounded-lg object-contain"
              />
              <span className="mt-2 text-xs text-accent-strong">
                WebP · {formatBytes(result.resultSize)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-ink">
            {formatBytes(result.originalSize)} → {formatBytes(result.resultSize)} · {reductionPct}%
            smaller
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onDownload}
              aria-label={`Download ${toWebpName(result.originalName)}`}
              className="btn-cta"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5l4.5 4.5m0 0l4.5-4.5M12 15V3"
                />
              </svg>
              Download .webp
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Convert another image"
              className="btn-glass"
            >
              Convert another
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="mt-4 rounded-xl border-2 border-dashed border-white/70 p-6 text-center">
          <svg
            aria-hidden="true"
            className="mx-auto mb-2 h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm font-medium text-ink">We couldn't convert that image.</p>
          <p className="mt-1 text-xs text-ink-muted">{errorMessage}</p>
          <button
            type="button"
            onClick={reset}
            aria-label="Try another image"
            className="btn-glass mt-4"
          >
            Try another
          </button>
        </div>
      )}
    </div>
  );
}
