'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:brightness-110 focus:ring-primary disabled:bg-outline',
  secondary:
    'bg-transparent text-on-surface border border-outline hover:bg-surface-container focus:ring-outline',
  ghost:
    'bg-transparent text-foreground border border-outline-strong hover:bg-surface-variant focus:ring-outline',
  danger:
    'bg-error text-on-error hover:brightness-110 focus:ring-error disabled:bg-outline',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-label-sm rounded-lg',
  md: 'px-4 py-2 text-label-md rounded-lg',
  lg: 'px-6 py-3 text-label-md rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <IconSpin />
        )}
        {children}
      </button>
    );
  },
);

function IconSpin() {
  return (
    <span className="material-symbols-outlined -ml-1 mr-2 h-4 w-4 animate-spin text-[16px]">
      progress_activity
    </span>
  );
}

Button.displayName = 'Button';
