"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-scrim)] px-4 py-6 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-cotton)] p-6 shadow-[var(--shadow-pop)] animate-[fadeSlideIn_0.2s_ease-out]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-rule)] pb-4">
          <h2 className="text-lg">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
