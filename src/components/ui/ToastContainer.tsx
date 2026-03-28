import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useAppToast';

const iconMap = {
  success: <CheckCircle size={16} className="text-teal-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-purple-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
};

const borderColorMap = {
  success: 'border-l-teal-400',
  error: 'border-l-red-400',
  info: 'border-l-purple-400',
  warning: 'border-l-amber-400',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`glass-card border-l-4 ${borderColorMap[t.type]} px-4 py-3 flex items-start gap-3`}
          >
            <div className="mt-0.5">{iconMap[t.type]}</div>
            <p className="text-[var(--text-primary)] text-sm flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
