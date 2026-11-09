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
    <main className="ruled-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
        >
          Rent<span className="text-[var(--color-accent)]">Ledger</span>
        </Link>
        <div className="panel mt-6 p-7">
          <h1 className="text-[1.6rem]">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
