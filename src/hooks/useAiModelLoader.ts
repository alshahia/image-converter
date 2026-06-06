import { useCallback, useState } from 'react';
import type { AiModel } from '../lib/engines/aiModels';
import { loadModel } from '../lib/engines/onnx';
import { toError } from '../lib/utils/errors';

export type AiLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseAiModelLoaderResult {
  status: AiLoadStatus;
  progress: number;
  error: Error | null;
  load: (id: AiModel['id']) => Promise<void>;
  reset: () => void;
}

export function useAiModelLoader(): UseAiModelLoaderResult {
  const [status, setStatus] = useState<AiLoadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (id: AiModel['id']) => {
    setStatus('loading');
    setProgress(0);
    setError(null);
    try {
      await loadModel(id, {
        onProgress: (loaded, total) => setProgress(Math.round((loaded / total) * 100)),
      });
      setProgress(100);
      setStatus('loaded');
    } catch (e) {
      const err = toError(e);
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, error, load, reset };
}
