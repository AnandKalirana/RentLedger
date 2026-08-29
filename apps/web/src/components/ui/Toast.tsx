"use client";

import { createContext, useCallback, useContext, useState, useId } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

const icons: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles: Record<ToastKind, string> = {
  success: "border-[var(--stamp)] text-[var(--stamp)]",
  error: "border-[var(--danger)] text-[var(--danger)]",
  info: "border-[var(--line)] text-[var(--ink-soft)]",
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = icons[item.kind];
  return (
    <div
      role="alert"
      className={clsx(
        "flex items-start gap-3 rounded-lg border bg-[var(--paper-raised)] px-4 py-3 shadow-md",
        "animate-[fadeSlideIn_0.2s_ease-out]",
        styles[item.kind]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p className="flex-1 text-sm text-[var(--ink)]">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="rounded p-0.5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast("success", msg),
    error: (msg) => toast("error", msg),
    info: (msg) => toast("info", msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2"
      >
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
