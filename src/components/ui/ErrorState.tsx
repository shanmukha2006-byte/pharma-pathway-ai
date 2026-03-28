import { AlertCircle } from 'lucide-react';
import AppButton from './AppButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="text-[var(--text-primary)] font-medium text-lg mb-1">Error</h3>
      <p className="text-[var(--text-muted)] text-sm max-w-sm mb-4">{message}</p>
      {onRetry && <AppButton variant="secondary" size="sm" onClick={onRetry}>Retry</AppButton>}
    </div>
  );
}
