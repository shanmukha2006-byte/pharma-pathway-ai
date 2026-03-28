import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  className?: string;
}

export default function Card({ children, title, subtitle, headerAction, className = '' }: CardProps) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-[var(--text-primary)] font-semibold text-sm">{title}</h3>}
            {subtitle && <p className="text-[var(--text-muted)] text-xs mt-0.5">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
