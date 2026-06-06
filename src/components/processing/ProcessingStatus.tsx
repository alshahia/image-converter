import { useState } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

export interface ProcessingStatusProps {
  progress: number;
  label?: string;
  onCancel?: () => void;
}

export function ProcessingStatus({
  progress,
  label = 'Converting...',
  onCancel,
}: ProcessingStatusProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = () => {
    if (!onCancel) return;
    setCancelling(true);
    onCancel();
  };

  return (
    <div className="animate-fade-in rounded-xl border border-neutral-200/80 bg-white p-6 shadow-soft dark:border-neutral-900 dark:bg-neutral-900 dark:shadow-dark-soft">
      <Progress value={progress} label={label} />
      {onCancel && (
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={handleCancel} variant="ghost" size="sm" disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
          {cancelling && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Stopping the worker — this can take a moment.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
