import { formatBytes } from '../../lib/utils/guardRails';
import { Button } from '../ui/button';

export interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-neutral-500">
          {file.type || 'unknown type'} · {formatBytes(file.size)}
        </p>
      </div>
      {onRemove && (
        <Button onClick={onRemove} variant="ghost" size="sm">
          Remove
        </Button>
      )}
    </div>
  );
}
