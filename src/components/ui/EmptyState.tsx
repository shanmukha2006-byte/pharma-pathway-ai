import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-[var(--text-muted)] mb-4">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-[var(--text-primary)] font-medium text-lg mb-1">{title}</h3>
      {subtitle && <p className="text-[var(--text-muted)] text-sm max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
