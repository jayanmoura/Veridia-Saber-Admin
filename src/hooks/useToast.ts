import { useContext } from 'react';
import { ToastContext, type ToastContextType } from '../contexts/toastContext';

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
