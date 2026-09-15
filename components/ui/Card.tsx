import React from 'react';

export type CardVariant = 'paper' | 'subtle' | 'outline' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  paper: 'bg-surface text-charcoal border-border shadow-sm',
  subtle: 'bg-surface-subtle text-charcoal border-border',
  outline: 'bg-transparent text-charcoal border-border',
  flat: 'bg-surface-subtle text-charcoal border-transparent',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  padding = 'md',
  interactive = false,
  selected = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        rounded-xl border transition-all duration-150
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${interactive ? 'cursor-pointer hover:border-steel hover:shadow-md active:translate-y-px' : ''}
        ${selected ? 'ring-2 ring-accent border-accent' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
