import { useCallback, useRef, useState } from 'react';

export type ConversionStatus = 'idle' | 'processing' | 'done' | 'error' | 'cancelled';

export interface UseConversionResult {
  status: ConversionStatus;
  progress: number;
  result: Blob | null;
  error: Error | null;
  run: (promise: Promise<Blob>, onProgress?: (pct: number) => void) => Promise<Blob | null>;
  cancel: () => void;
  reset: () => void;
}

export function useConversion(onCancel?: () => void): UseConversionResult {
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  const run = useCallback(async (promise: Promise<Blob>, onProgress?: (pct: number) => void) => {
    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setResult(null);
    setError(null);

    const progressHandler = onProgress
      ? (pct: number) => {
          if (!cancelledRef.current) {
            setProgress(pct);
            onProgress(pct);
          }
        }
      : undefined;

    void progressHandler;

    try {
      const blob = await promise;
      if (cancelledRef.current) {
        setStatus('cancelled');
        return null;
      }
      setResult(blob);
      setProgress(100);
      setStatus('done');
      return blob;
    } catch (err) {
      if (cancelledRef.current) {
        setStatus('cancelled');
        return null;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus('error');
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    onCancel?.();
  }, [onCancel]);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, run, cancel, reset };
}
