"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const schema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!token) {
      setServerError("Missing reset token");
      return;
    }
    setServerError(null);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Password reset failed");
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-sm text-[var(--danger)]">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-sm font-medium text-[var(--color-accent-deep)] underline-offset-4 hover:underline">
          Request a new password reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div role="status" className="rounded-[var(--radius-input)] bg-[var(--stamp-soft)] p-4 text-sm text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
          Password reset successfully! Redirecting to login…
        </div>
        <Link href="/login" className="inline-block text-sm font-medium text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-rule-2)] hover:decoration-[var(--color-accent)]">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="New Password" type="password" {...register("newPassword")} error={errors.newPassword?.message} />
      <Field label="Confirm New Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
      {serverError && <p role="alert" className="text-sm text-[var(--danger)]">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Resetting password..." : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set new password" subtitle="Enter your new password below.">
      <Suspense fallback={<p className="text-center text-sm text-[var(--color-muted)]">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
