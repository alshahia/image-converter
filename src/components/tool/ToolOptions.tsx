import type { ReactNode } from 'react';
import { Card } from '../ui/card';

export interface ToolOptionsProps {
  title?: string;
  children: ReactNode;
}

export function ToolOptions({ title, children }: ToolOptionsProps) {
  return (
    <Card>
      {title && (
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {title}
        </h2>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}
