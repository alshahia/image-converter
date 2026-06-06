import { useEffect } from 'react';
import { useAiModelLoader } from '../../hooks/useAiModelLoader';
import { type AiModel, formatModelSize } from '../../lib/engines/aiModels';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

export interface AiModelLoaderProps {
  model: AiModel;
  onLoaded?: () => void;
}

export function AiModelLoader({ model, onLoaded }: AiModelLoaderProps) {
  const { status, progress, error, load, reset } = useAiModelLoader();

  useEffect(() => {
    if (status === 'loaded' && onLoaded) onLoaded();
  }, [status, onLoaded]);

  if (status === 'idle') {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Load {model.displayName} ({formatModelSize(model.bytes)})
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Downloaded once, then cached in your browser.
        </p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => load(model.id)}>Load model</Button>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
        <Progress value={progress} label={`Loading ${model.displayName}…`} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
      >
        <h3 className="font-semibold text-red-900 dark:text-red-100">Model load failed</h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-200">
          {error?.message ?? 'Unknown error'}
        </p>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => load(model.id)} variant="destructive" size="sm">
            Try again
          </Button>
          <Button onClick={reset} variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
