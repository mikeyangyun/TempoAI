'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: ToastItem['action']) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', action?: ToastItem['action']) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, type, action }]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right-5 fade-in-0 max-w-sm',
        toast.type === 'error' && 'bg-destructive/10 border-destructive/30 text-destructive',
        toast.type === 'success' && 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
        toast.type === 'info' && 'bg-background border-border text-foreground'
      )}
    >
      {toast.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
      {toast.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
      <span className="flex-1 text-sm">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
