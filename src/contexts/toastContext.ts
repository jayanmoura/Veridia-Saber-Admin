import { createContext } from 'react';
import type { Toast, ToastType, ToastAction } from '../types/toast';

export interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number, action?: ToastAction) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

