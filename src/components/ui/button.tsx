import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'rounded-pill bg-drift-cta text-white shadow-drift-cta hover:scale-[1.02] hover:shadow-drift-cta active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100',
  secondary:
    'rounded-pill border border-white/70 bg-glass-soft text-ink shadow-glass-inset backdrop-blur-glass-sm hover:bg-glass-strong active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-ink-inverse dark:hover:bg-white/[0.08]',
  ghost:
    'rounded-lg text-ink-muted hover:text-ink hover:bg-white/50 active:bg-white/70 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-ink-inverse dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]',
  destructive:
    'rounded-lg border border-red-500/40 bg-red-500/15 text-red-600 shadow-soft hover:bg-red-500/25 active:scale-[0.98] disabled:opacity-50 dark:border-red-400/30 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
});
