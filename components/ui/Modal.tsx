import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div
        className={`
          relative w-full ${maxWidthStyles[maxWidth]} max-h-full flex flex-col
          bg-surface text-charcoal rounded-2xl border border-border shadow-xl z-10 overflow-hidden
        `}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border bg-surface-subtle/50 flex-shrink-0">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-lg sm:text-xl font-display font-bold text-charcoal">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="text-xs sm:text-sm text-steel mt-0.5">{subtitle}</p>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1.5 h-8 w-8 text-steel hover:text-charcoal"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
