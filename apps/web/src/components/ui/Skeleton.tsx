import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

/** Pulsing placeholder shown while data loads — replace "Loading…" text with this. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-[var(--color-paper-3)]",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** A stack of skeleton rows mimicking a table or list. */
export function SkeletonList({ lines = 4 }: SkeletonProps) {
  return (
    <div className="panel mt-6 divide-y divide-[var(--color-rule)]" aria-label="Loading…" role="status">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="ml-auto h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

/** A 2×4 grid of stat card skeletons for the dashboard overview. */
export function SkeletonStatGrid() {
  return (
    <div
      className="panel mt-8 grid grid-cols-2 gap-px overflow-hidden bg-[var(--color-rule)] lg:grid-cols-4 [&>*]:bg-[var(--color-cotton)]"
      aria-label="Loading…"
      role="status"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-5 py-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-20" />
        </div>
      ))}
    </div>
  );
}
