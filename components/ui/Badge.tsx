import React from 'react';

export type BadgeVariant = 'default' | 'accent' | 'conflict' | 'danger' | 'subtle';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-subtle text-charcoal border-border',
  accent: 'bg-accent-light text-accent border-accent/30',
  conflict: 'bg-conflict-light text-conflict border-conflict/30 font-semibold',
  danger: 'bg-danger-light text-danger border-danger/30',
  subtle: 'bg-surface text-steel border-border-subtle',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-sans tracking-wide
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon}
      {children}
    </span>
  );
};
