import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-end border-b border-[var(--line)] bg-[var(--paper-raised)] px-6">
      <NotificationBell />
    </header>
  );
}
