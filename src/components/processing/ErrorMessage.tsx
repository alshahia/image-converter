import { Button } from '../ui/button';

export interface ErrorMessageProps {
  error: Error | string;
  onRetry?: () => void;
  onReset?: () => void;
  title?: string;
}

export function ErrorMessage({ error, onRetry, onReset, title }: ErrorMessageProps) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
    >
      <h3 className="font-semibold text-red-900 dark:text-red-100">
        {title ?? 'Conversion failed'}
      </h3>
      <p className="mt-1 text-sm text-red-800 dark:text-red-200">{message}</p>
      {(onRetry || onReset) && (
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="destructive" size="sm">
              Try again
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="ghost" size="sm">
              Choose a different file
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
