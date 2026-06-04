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
  return (
    <div className="animate-fade-in rounded-xl border border-neutral-200/80 bg-white p-6 shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-dark-soft">
      <Progress value={progress} label={label} />
      {onCancel && (
        <div className="mt-3">
          <Button onClick={onCancel} variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
