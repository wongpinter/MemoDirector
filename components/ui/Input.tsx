import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  error = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-3 text-steel pointer-events-none flex items-center justify-center">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        disabled={disabled}
        className={`
          w-full h-10 rounded-lg bg-surface text-charcoal border text-sm font-sans
          placeholder:text-steel/60 transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
          disabled:bg-surface-subtle disabled:text-steel disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border hover:border-steel'}
          ${leftIcon ? 'pl-9' : 'pl-3'}
          ${rightIcon ? 'pr-9' : 'pr-3'}
          ${className}
        `}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 text-steel flex items-center justify-center">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
