import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-charcoal text-surface hover:bg-charcoal-dark focus-visible:ring-charcoal',
  accent: 'bg-accent text-surface hover:bg-accent-hover focus-visible:ring-accent shadow-sm',
  secondary: 'bg-surface-subtle text-charcoal hover:bg-border focus-visible:ring-steel',
  outline: 'bg-surface text-charcoal border border-border hover:bg-surface-subtle focus-visible:ring-steel',
  ghost: 'bg-transparent text-charcoal hover:bg-surface-subtle focus-visible:ring-steel',
  danger: 'bg-danger text-surface hover:bg-danger-dark focus-visible:ring-danger',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
