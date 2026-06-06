import { formatModelSize } from '../../lib/engines/aiModels';

export interface AiDisclosureModel {
  readonly displayName: string;
  readonly bytes: number;
  readonly license: 'Apache-2.0' | 'BSD-3-Clause' | string;
  readonly attributionUrl: string;
  readonly attributionName: string;
}

export interface AiDisclosureProps {
  model: AiDisclosureModel;
}

export function AiDisclosure({ model }: AiDisclosureProps) {
  const usesModel = model.bytes > 0;
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 h-5 w-5 shrink-0"
        role="img"
        aria-label="AI model notice"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="font-medium">
          {usesModel
            ? `This tool uses an AI model (${formatModelSize(model.bytes)}). It runs entirely on your device — your images never leave your browser.`
            : 'This tool uses local codec engines. It runs entirely on your device — your images never leave your browser.'}
        </p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
          {usesModel ? 'Model' : 'Engine'}:{' '}
          <a
            className="underline"
            href={model.attributionUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {model.attributionName}
          </a>{' '}
          ({model.license})
        </p>
      </div>
    </aside>
  );
}
