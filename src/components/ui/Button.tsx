import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary hover:bg-primary-light text-white border border-transparent',
      secondary: 'bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-white border border-transparent',
      outline: 'bg-transparent hover:bg-surfaceHighlight text-white border border-surfaceHighlight',
      ghost: 'bg-transparent hover:bg-surfaceHighlight/50 text-textMuted hover:text-white border border-transparent',
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
