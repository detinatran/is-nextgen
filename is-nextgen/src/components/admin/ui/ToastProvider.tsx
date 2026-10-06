"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastContainer } from "./Toast";
import type { Toast, ToastVariant } from "./Toast";

interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<Toast, "id">) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addToast = useCallback((options: Omit<Toast, "id">) => {
    const id = generateId();
    const toast: Toast = { ...options, id };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, "id">) => addToast(options),
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: "success" }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: "error" }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: "warning" }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: "info" }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
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