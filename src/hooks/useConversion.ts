import { useCallback, useRef, useState } from 'react';
import { toError } from '../lib/utils/errors';

/**
 * Conversion state machine.
 *
 * Progress is engine-specific and is *not* threaded through this hook:
 *   - jsquash: routes use the conversion promise only; no progress stream
 *   - ffmpeg: routes call onProgressFFmpeg() before exec
 *   - ai: routes call useAiModelLoader.load() and surface its progress separately
 *
 * Cancellation (H-3):
 *   - run() accepts either a Promise<Blob> (legacy) or a factory
 *     (signal: AbortSignal) => Promise<Blob> (signal-aware).
 *   - When a factory is supplied, the signal is aborted on cancel().
 *   - In both cases, the resolved/rejected value is ignored if cancel()
 *     was called in the meantime, and status transitions to 'cancelled'.
 *   - Engine-level teardown (terminateFFmpeg, etc.) is the route's
 *     responsibility via the onCancel hook.
 */
export type ConversionStatus = 'idle' | 'processing' | 'done' | 'error' | 'cancelled';

export type RunArg = Promise<Blob> | ((signal: AbortSignal) => Promise<Blob>);

export interface UseConversionResult {
  status: ConversionStatus;
  progress: number;
  result: Blob | null;
  error: Error | null;
  run: (arg: RunArg) => Promise<Blob | null>;
  cancel: () => void;
  reset: () => void;
  /**
   * Engine-side progress reporter. Routes that drive progress themselves
   * (ffmpeg, AI) call this with each progress tick; useConversion will not
   * snap to 100% on completion if any non-zero progress was reported.
   */
  setProgress: (pct: number) => void;
}

export function useConversion(onCancel?: () => void): UseConversionResult {
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgressState] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const engineReportedRef = useRef(false);

  const setProgress = useCallback((pct: number) => {
    if (pct > 0) engineReportedRef.current = true;
    setProgressState(pct);
  }, []);

  const run = useCallback(async (arg: RunArg) => {
    if (runningRef.current) {
      throw new Error('useConversion.run() is already in progress');
    }
    runningRef.current = true;
    cancelledRef.current = false;
    engineReportedRef.current = false;
    abortRef.current = new AbortController();
    setStatus('processing');
    setProgressState(0);
    setResult(null);
    setError(null);

    const signal = abortRef.current.signal;
    const promise = typeof arg === 'function' ? arg(signal) : arg;

    try {
      const blob = await promise;
      if (cancelledRef.current) {
        setStatus('cancelled');
        return null;
      }
      setResult(blob);
      if (!engineReportedRef.current) {
        setProgressState(100);
      }
      setStatus('done');
      return blob;
    } catch (err) {
      if (cancelledRef.current) {
        setStatus('cancelled');
        return null;
      }
      const e = toError(err);
      setError(e);
      setStatus('error');
      return null;
    } finally {
      runningRef.current = false;
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    onCancel?.();
  }, [onCancel]);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    engineReportedRef.current = false;
    setStatus('idle');
    setProgressState(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, run, cancel, reset, setProgress };
}
