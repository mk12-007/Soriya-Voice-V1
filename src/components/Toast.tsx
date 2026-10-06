import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
  };

  const bgColors = {
    success: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-100 shadow-emerald-500/5',
    error: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-100 shadow-rose-500/5',
    info: 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100 shadow-indigo-500/5',
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${
        bgColors[toast.type]
      }`}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium leading-relaxed font-khmer">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-3 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
