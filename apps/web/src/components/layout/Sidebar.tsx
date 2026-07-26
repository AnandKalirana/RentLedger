"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Users, Receipt, Link2, Settings, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: Receipt },
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

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--paper-raised)]">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          RentLedger
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-[var(--stamp-soft)] text-[var(--stamp)]"
                  : "text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--line)] px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </aside>
  );
}
