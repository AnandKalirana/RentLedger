import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-end border-b border-[var(--color-rule)] bg-[var(--color-paper)] px-4 md:px-8">
      <NotificationBell />
    </header>
  );
}
