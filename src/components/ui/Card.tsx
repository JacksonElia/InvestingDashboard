import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      className={cn("bg-surface border border-surfaceHighlight rounded-xl shadow-lg overflow-hidden", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("px-6 py-5 border-b border-surfaceHighlight", className)}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-textMuted mt-1">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-5", className)}>
      {children}
    </div>
  );
}
