import clsx from "clsx";

const styles: Record<string, string> = {
  PENDING: "bg-[var(--color-warn-soft)] text-[var(--color-warn)] ring-[var(--color-warn)]/25",
  VERIFIED: "bg-[var(--stamp-soft)] text-[var(--color-accent-deep)] ring-[var(--stamp)]/25",
  REJECTED: "bg-[var(--danger-soft)] text-[var(--danger)] ring-[var(--danger)]/25",
  ACTIVE: "bg-[var(--stamp-soft)] text-[var(--color-accent-deep)] ring-[var(--stamp)]/25",
  INACTIVE: "bg-[var(--color-paper-2)] text-[var(--color-muted)] ring-[var(--color-rule-2)]",
};

const fallback = "bg-[var(--color-paper-2)] text-[var(--color-muted)] ring-[var(--color-rule-2)]";

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? fallback
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
