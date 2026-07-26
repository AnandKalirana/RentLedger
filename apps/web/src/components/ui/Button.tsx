import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<string, string> = {
  primary: "bg-[var(--stamp)] text-white hover:bg-[#0c5a3f]",
  secondary: "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--paper)]",
  ghost: "text-[var(--ink)] hover:bg-[var(--paper)]",
};

const sizes: Record<string, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
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
