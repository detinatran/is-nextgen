"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  }
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_WIDTH = 384;

const VARIANT_STYLES: Record<ToastVariant, { icon: ReactNode; bg: string; text: string; border: string }> = {
  success: {
    icon: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/60",
  },
  error: {
    icon: (
      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200/60",
  },
  warning: {
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/60",
  },
  info: {
    icon: (
      <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200/60",
  },
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { title, description, variant = "info", action, duration = 5000 } = toast;
  const styles = VARIANT_STYLES[variant];
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(pct);
        if (pct <= 0) {
          clearInterval(interval);
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 200);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [duration, toast.id, onClose]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 200);
  }, [onClose, toast.id]);

  const handleActionClick = useCallback(() => {
    action?.onClick();
    onClose(toast.id);
  }, [action, onClose, toast.id]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-full max-w-[${TOAST_WIDTH}px]
        rounded-lg border shadow-lg
        ${styles.bg} ${styles.text} ${styles.border}
        transition-all duration-200 ease-out
        animate-toast-enter
        ${isExiting ? "animate-toast-exit" : ""}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5" aria-hidden="true">{styles.icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="mt-1 text-sm opacity-90">{description}</p>
        )}
        {action && (
          <button
            onClick={handleActionClick}
            className="mt-3 text-sm font-medium underline hover:no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
        aria-label="Đóng thông báo"
      >
        <svg className="w-4 h-4 opacity-60 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 rounded-bl-lg rounded-br-lg bg-current/20"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Thời gian tự động đóng"
        />
      )}
    </div>
  );
}

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  maxToasts?: number;
  gap?: number;
  className?: string;
}

export function ToastContainer({
  position = "top-right",
  maxToasts = 5,
  gap = 8,
  className = "",
}: ToastContainerProps) {
  const { toasts, hideToast } = useToast();

  const positionStyles: Record<string, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  const visibleToasts = toasts.slice(-maxToasts);

  return (
    <div
      className={`
        fixed z-[9999] pointer-events-none
        ${positionStyles[position]}
        flex flex-col gap-${gap / 4}
        ${className}
      `}
      aria-live="polite"
      aria-label="Thông báo hệ thống"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-[384px]">
          <ToastItem toast={toast} onClose={hideToast} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function useToastHelpers() {
  const { showToast } = useToast();

  const toast = useCallback(
    (title: string, options?: Partial<Omit<Toast, "id" | "title">>) => {
      return showToast({ title, ...options });
    },
    [showToast]
  );

  const success = useCallback(
    (title: string, description?: string, options?: Partial<Omit<Toast, "id" | "title" | "variant">>) => {
      return showToast({ title, description, variant: "success", ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string, options?: Partial<Omit<Toast, "id" | "title" | "variant">>) => {
      return showToast({ title, description, variant: "error", ...options });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<Omit<Toast, "id" | "title" | "variant">>) => {
      return showToast({ title, description, variant: "warning", ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string, options?: Partial<Omit<Toast, "id" | "title" | "variant">>) => {
      return showToast({ title, description, variant: "info", ...options });
    },
    [showToast]
  );

  return { toast, success, error, warning, info };
}

export default function ToastRoot({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}