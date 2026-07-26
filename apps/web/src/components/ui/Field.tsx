import { InputHTMLAttributes, forwardRef } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, id, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
);
Field.displayName = "Field";
