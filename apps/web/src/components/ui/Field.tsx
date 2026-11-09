import { InputHTMLAttributes, forwardRef, useId } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, id, ...props }, ref) => {
    // Callers rarely pass an id; generate one so the label is always attached to its input.
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className="input mt-1.5"
          {...props}
        />
        {error && <p className="mt-1.5 text-[0.8125rem] text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);
Field.displayName = "Field";
