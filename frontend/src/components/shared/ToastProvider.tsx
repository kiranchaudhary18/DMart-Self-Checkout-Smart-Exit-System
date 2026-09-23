"use client";

import React, { createContext, useCallback, useState, ReactNode } from "react";
import { Toast, ToastProps, ToastVariant } from "./Toast";

type ToastOptions = Omit<ToastProps, "id" | "onClose">;

interface ToastContextValue {
  toasts: ToastProps[];
  toast: (options: ToastOptions) => void;
  success: (message: string, title?: string, options?: Partial<ToastOptions>) => void;
  error: (message: string, title?: string, options?: Partial<ToastOptions>) => void;
  warning: (message: string, title?: string, options?: Partial<ToastOptions>) => void;
  info: (message: string, title?: string, options?: Partial<ToastOptions>) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { ...options, id, onClose: removeToast }];
      // Keep only the most recent toasts based on MAX_TOASTS
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(newToasts.length - MAX_TOASTS);
      }
      return newToasts;
    });
  }, [removeToast]);

  const success = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    addToast({ message, title, variant: "success", ...options });
  }, [addToast]);

  const error = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    addToast({ message, title, variant: "error", ...options });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    addToast({ message, title, variant: "warning", ...options });
  }, [addToast]);

  const info = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    addToast({ message, title, variant: "info", ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, warning, info, dismiss: removeToast }}>
      {children}
      {/* Portal destination for toasts */}
      <div 
        className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px] gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
