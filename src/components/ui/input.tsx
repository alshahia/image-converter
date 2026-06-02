import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`h-10 w-full rounded-md border bg-white px-3 text-sm transition placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:focus-visible:ring-neutral-50 ${
        invalid
          ? 'border-red-500 text-red-900 dark:border-red-700 dark:text-red-100'
          : 'border-neutral-300 text-neutral-900 dark:border-neutral-700 dark:text-neutral-50'
      } ${className}`}
      {...rest}
    />
  );
});
