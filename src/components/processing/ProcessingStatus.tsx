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
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <Progress value={progress} label={label} />
      {onCancel && (
        <div>
          <Button onClick={onCancel} variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
