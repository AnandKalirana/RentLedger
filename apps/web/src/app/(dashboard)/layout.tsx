import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <div className="min-h-screen min-w-0 flex-1 bg-[var(--color-paper)]">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
