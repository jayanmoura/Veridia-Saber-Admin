import { useState, useCallback, type ReactNode } from 'react';
import { ToastContext } from './toastContext';
import type { Toast, ToastType } from '../types/toast';

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
  warning: 6000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      id,
      message,
      type,
      duration: duration ?? DEFAULT_DURATION[type],
    };
    setToasts(prev => {
      const next = [...prev, newToast];
      return next.length > 4 ? next.slice(-4) : next;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}