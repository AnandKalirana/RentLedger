import { SelectHTMLAttributes, forwardRef, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, children, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className="input mt-1.5"
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-[0.8125rem] text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
