import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, children, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      <select
        ref={ref}
        id={id}
        className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
