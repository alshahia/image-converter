import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`glass-card-soft p-5 sm:p-6 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-glass-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: CardProps) {
  return (
    <h2
      className={`font-display text-xl tracking-tightest text-ink dark:text-ink-inverse ${className}`}
      {...rest}
    >
      {children}
    </h2>
  );
}
