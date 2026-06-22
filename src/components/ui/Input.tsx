import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-surfaceHighlight border border-surfaceHighlight/50 rounded-lg py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
            icon ? "pl-10 pr-4" : "px-4",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
