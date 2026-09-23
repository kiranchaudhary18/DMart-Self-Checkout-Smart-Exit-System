import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
};

export function Toast({
  id,
  title,
  message,
  variant = "info",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  const styles = variantStyles[variant];

  // Auto-dismiss
  useEffect(() => {
    if (duration === Infinity) return;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for exit animation
  };

  return (
    <div
      role="alert"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
        styles.bg,
        styles.border,
        isClosing ? "translate-x-full opacity-0 md:translate-x-0 md:translate-y-2" : "translate-x-0 opacity-100 translate-y-0"
      )}
    >
      <div className="shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn("text-sm font-semibold mb-1", styles.text)}>
            {title}
          </h4>
        )}
        <p className={cn("text-sm break-words", styles.text, !title && "font-medium")}>
          {message}
        </p>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              handleClose();
            }}
            className={cn(
              "mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity",
              styles.text
            )}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className={cn("shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity", styles.text)}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
