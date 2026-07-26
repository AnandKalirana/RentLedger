import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen flex-1 bg-[var(--paper)]">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
