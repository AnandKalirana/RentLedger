export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-5 py-5">
      <p className="text-[0.8125rem] font-medium text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 font-mono-data text-[1.65rem] font-medium leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-[0.8125rem] text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}
