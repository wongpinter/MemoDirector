import React, { createContext, useContext, useState, useCallback } from 'react';
import { UI_CONSTANTS } from '../constants';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string | { message: string; type?: ToastType }, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string | { message: string; type?: ToastType }, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;

    let toastMessage: string;
    let toastType: ToastType;

    if (typeof message === 'string') {
      toastMessage = message;
      toastType = type;
    } else {
      toastMessage = message.message;
      toastType = message.type || 'info';
    }

    const newToast: Toast = { id, message: toastMessage, type: toastType };

    setToasts(prev => [...prev, newToast]);

    // Auto-hide after duration
    setTimeout(() => {
      hideToast(id);
    }, UI_CONSTANTS.TOAST_DURATION);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Individual Toast Item
interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const bgColor = {
    success: 'bg-accent text-surface border border-accent/40',
    error: 'bg-danger text-surface border border-danger/40',
    warning: 'bg-conflict text-surface border border-conflict/40',
    info: 'bg-charcoal text-surface border border-charcoal-dark',
  }[toast.type];

  return (
    <div
      className={`${bgColor} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-72 max-w-md pointer-events-auto animate-slide-in font-sans`}
      role="alert"
    >
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="text-surface/80 hover:text-surface transition-colors p-1"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
