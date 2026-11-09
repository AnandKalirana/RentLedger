import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] font-medium whitespace-nowrap " +
  "transition-[background-color,box-shadow,transform] duration-150 ease-out active:translate-y-px " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<string, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] " +
    "shadow-[var(--shadow-primary)] " +
    "hover:bg-[var(--color-accent-deep)] active:shadow-[var(--shadow-primary-down)]",
  secondary:
    "bg-[var(--color-cotton)] text-[var(--color-ink)] " +
    "shadow-[var(--shadow-key)] " +
    "hover:bg-[var(--color-paper-2)] active:bg-[var(--color-paper-3)]",
  ghost:
    "text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]",
};

const sizes: Record<string, string> = {
  sm: "text-sm h-9 px-3",
  md: "text-sm h-10 px-4",
  lg: "text-base h-12 px-6",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
