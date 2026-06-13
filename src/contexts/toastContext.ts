import { createContext } from 'react';
import type { Toast, ToastType } from '../types/toast';

export interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
