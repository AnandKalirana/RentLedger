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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-[var(--ink-soft)] hover:bg-[var(--paper)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
