import clsx from "clsx";

const styles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  VERIFIED: "bg-[var(--stamp-soft)] text-[var(--stamp)] border-[var(--stamp)]/30",
  REJECTED: "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30",
  ACTIVE: "bg-[var(--stamp-soft)] text-[var(--stamp)] border-[var(--stamp)]/30",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
