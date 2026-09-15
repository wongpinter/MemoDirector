import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type NoticeVariant = 'info' | 'warning' | 'danger' | 'success';

export interface NoticeProps {
  variant?: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<NoticeVariant, { container: string; iconClass: string; defaultIcon: React.ReactNode }> = {
  info: {
    container: 'bg-accent-light text-charcoal border-accent/30',
    iconClass: 'text-accent',
    defaultIcon: <Info className="w-4 h-4 flex-shrink-0" />,
  },
  warning: {
    container: 'bg-conflict-light text-conflict-dark border-conflict/30',
    iconClass: 'text-conflict',
    defaultIcon: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  },
  danger: {
    container: 'bg-danger-light text-danger-dark border-danger/30',
    iconClass: 'text-danger',
    defaultIcon: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
  },
  success: {
    container: 'bg-surface text-charcoal border-border',
    iconClass: 'text-accent',
    defaultIcon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
  },
};

export const Notice: React.FC<NoticeProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className = '',
}) => {
  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-sans
        ${current.container}
        ${className}
      `}
    >
      <span className={current.iconClass}>{icon || current.defaultIcon}</span>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
