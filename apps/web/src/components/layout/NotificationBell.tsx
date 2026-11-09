"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const res = await api.get<{ data: Notification[] }>("/notifications");
      setNotifications(res.data.data);
    } catch {
      // Ignore background notification fetch errors when unauthenticated
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await api.patch(`/notifications/${id}/read`);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative rounded-[var(--radius-input)] p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--stamp)] px-1 text-[11px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-cotton)] shadow-[var(--shadow-pop)]">
          <div className="border-b border-[var(--color-rule)] px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--ink-soft)]">
                Nothing here yet.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-[var(--color-rule)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[var(--color-paper-2)] active:bg-[var(--color-paper-3)]"
                >
                  <div className="flex w-full items-center gap-2">
                    {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--stamp)]" />}
                    <span className="text-sm font-medium">{n.title}</span>
                  </div>
                  <p className="text-[0.8125rem] text-[var(--color-muted)]">{n.message}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
