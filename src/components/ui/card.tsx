import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`mb-2 flex items-center justify-between ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: CardProps) {
  return (
    <h2 className={`font-semibold ${className}`} {...rest}>
      {children}
    </h2>
  );
}
