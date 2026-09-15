import React from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-xs font-semibold text-charcoal tracking-wide flex items-center gap-1">
              {label}
              {required && <span className="text-danger">*</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error && <span className="text-xs text-danger font-medium">{error}</span>}
      {!error && hint && <span className="text-xs text-steel">{hint}</span>}
    </div>
  );
};
