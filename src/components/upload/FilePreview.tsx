import { formatBytes } from '../../lib/utils/guardRails';
import { Button } from '../ui/button';

export interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="animate-slide-up flex items-center justify-between gap-3 rounded-glass-sm border border-white/60 bg-glass-soft p-3.5 shadow-glass-sm backdrop-blur-glass-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-drift-pink/70 text-accent-strong shadow-drift-card dark:bg-accent/20 dark:text-accent-soft">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink dark:text-ink-inverse">
            {file.name}
          </p>
          <p className="text-xs text-ink-muted dark:text-neutral-400">
            {file.type || 'unknown type'} &middot; {formatBytes(file.size)}
          </p>
        </div>
      </div>
      {onRemove && (
        <Button onClick={onRemove} variant="ghost" size="sm">
          Remove
        </Button>
      )}
    </div>
  );
}
