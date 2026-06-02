export interface FileSizeWarningProps {
  reason: string;
  onContinue?: () => void;
  onCancel?: () => void;
}

export function FileSizeWarning({ reason, onContinue, onCancel }: FileSizeWarningProps) {
  return (
    <output className="block rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Large file warning</h3>
      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{reason}</p>
      {(onContinue || onCancel) && (
        <div className="mt-3 flex gap-2">
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Continue anyway
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-amber-900 underline hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-300"
            >
              Choose a different file
            </button>
          )}
        </div>
      )}
    </output>
  );
}
