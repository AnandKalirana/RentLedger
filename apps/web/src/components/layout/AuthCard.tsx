import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          RentLedger
        </Link>
        <h1 className="mt-6 text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{subtitle}</p>
        <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
