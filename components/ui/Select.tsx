import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  children,
  error = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="relative inline-flex items-center w-full">
      <select
        ref={ref}
        disabled={disabled}
        className={`
          w-full h-10 rounded-lg bg-surface text-charcoal border text-sm font-sans pl-3 pr-8
          appearance-none transition-colors duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
          disabled:bg-surface-subtle disabled:text-steel disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border hover:border-steel'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-steel absolute right-2.5 pointer-events-none" />
    </div>
  );
});

Select.displayName = 'Select';
