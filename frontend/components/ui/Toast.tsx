/**
 * Toast — Lightweight in-app notification system.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ToastVariant = "info" | "success" | "warning" | "error" | "premium";

export interface ToastMessage {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (msg: string, variant?: ToastVariant, duration?: number) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single Toast Item ────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-white/10 text-text-primary",
  success: "border-accent-green/30 text-accent-green",
  warning: "border-amber-400/30 text-amber-400",
  error: "border-red-500/30 text-red-400",
  premium: "border-accent-purple/40 text-accent-purple",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  premium: "💎",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const variant = toast.variant ?? "info";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-surface/90 backdrop-blur-xl px-4 py-3 max-w-sm cursor-pointer shadow-2xl",
        VARIANT_STYLES[variant]
      )}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="text-lg leading-none mt-0.5">
        {VARIANT_ICONS[variant]}
      </span>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </motion.div>
  );
}
