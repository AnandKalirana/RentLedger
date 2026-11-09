"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post<{ data: { token?: string } }>("/auth/forgot-password", values);
      setSuccessMsg("If an account exists with this email, reset instructions have been created.");
      if (res.data?.data?.token) {
        console.log("Dev reset link:", `/reset-password?token=${res.data.data.token}`);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to request reset");
    }
  }

  return (
    <AuthCard title="Reset password" subtitle="Enter your registered email to receive reset instructions.">
      {successMsg ? (
        <div className="space-y-4 text-center">
          <div role="status" className="rounded-[var(--radius-input)] bg-[var(--stamp-soft)] p-4 text-sm text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
            {successMsg}
          </div>
          <p className="text-[0.8125rem] text-[var(--color-muted)]">
            Check your email inbox or check server logs in development environment.
          </p>
          <Link href="/login" className="inline-block text-sm font-medium text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-rule-2)] hover:decoration-[var(--color-accent)]">
            Back to login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
          {serverError && <p role="alert" className="text-sm text-[var(--danger)]">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending reset link..." : "Send reset instructions"}
          </Button>
          <div className="text-center">
            <Link href="/login" className="text-[0.8125rem] text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
