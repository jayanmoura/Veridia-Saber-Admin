import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { ToastType } from '../types/toast';

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: 'bg-forest-900 text-white',
  error: 'bg-red-700 text-white',
  warning: 'bg-earth-800 text-white',
  info: 'bg-neutral-700 text-white',
};

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  useEffect(() => {
    const timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    toasts.forEach(toast => {
      if (timers.has(toast.id)) return;
      if (toast.duration !== Infinity) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration ?? 4000);
        timers.set(toast.id, timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col-reverse gap-3 pointer-events-none">
      {toasts.map(toast => {
        const IconComponent = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              rounded-lg shadow-lg px-4 py-3
              flex items-center gap-3
              min-w-[300px] max-w-[420px]
              opacity-100 translate-y-0
              transition-all duration-300 ease-out
              ${COLOR_MAP[toast.type]}
            `}
            role="alert"
          >
            <IconComponent size={20} className="shrink-0" />
            <span className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}