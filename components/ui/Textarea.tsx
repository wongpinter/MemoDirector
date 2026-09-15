import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  error = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      className={`
        w-full rounded-lg bg-surface text-charcoal border text-sm font-sans p-3
        placeholder:text-steel/60 transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
        disabled:bg-surface-subtle disabled:text-steel disabled:cursor-not-allowed
        ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border hover:border-steel'}
        ${className}
      `}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
