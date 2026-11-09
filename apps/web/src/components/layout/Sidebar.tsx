"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Users, Receipt, Link2, Settings, LogOut, Wrench, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/payment-links", label: "Payment links", icon: Link2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api.post("/auth/logout");
    router.push("/login");
  }

  // A left rail from 768px up; under that the same links scroll in a strip below the wordmark.
  return (
    <aside className="flex flex-wrap items-center border-b border-[var(--color-rule)] bg-[var(--color-cotton)] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:border-b-0 md:border-r">
      <div className="order-1 flex-1 px-4 py-3 md:flex-none md:px-5 md:py-5">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
        >
          Rent<span className="text-[var(--color-accent)]">Ledger</span>
        </Link>
      </div>
      <nav className="order-3 flex w-full basis-full gap-1 overflow-x-auto px-3 pb-2 md:order-2 md:basis-auto md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--color-accent)] max-md:before:hidden"
                  : "text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="order-2 px-3 md:order-3 md:border-t md:border-[var(--color-rule)] md:py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </aside>
  );
}
