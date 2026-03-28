import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'purple' | 'gray';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  error: 'badge-error',
  warning: 'badge-warning',
  info: 'badge-info',
  purple: 'badge-info',
  gray: 'badge-gray',
};

export default function AppBadge({ children, variant = 'gray', size = 'sm', className = '' }: BadgeProps) {
  const sizeClass = size === 'md' ? 'text-xs px-3 py-1' : '';
  return (
    <span className={`${variantClasses[variant]} inline-flex items-center whitespace-nowrap ${sizeClass} ${className}`}>
      {children}
    </span>
  );
}
