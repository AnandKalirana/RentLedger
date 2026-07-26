export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-5">
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
      <p className="mt-2 font-mono-data text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}
