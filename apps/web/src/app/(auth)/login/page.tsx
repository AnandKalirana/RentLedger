"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { GoogleLoginButton } from "@/components/layout/GoogleLoginButton";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post("/auth/login", values);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back. Enter your details below.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-ink)]">Password</label>
            <Link
              href="/forgot-password"
              className="text-[0.8125rem] font-medium text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            {...register("password")}
            aria-invalid={errors.password ? true : undefined}
            className="input mt-1.5"
          />
          {errors.password?.message && (
            <p className="mt-1.5 text-[0.8125rem] text-[var(--danger)]">{errors.password.message}</p>
          )}
        </div>
        {serverError && <p role="alert" className="text-sm text-[var(--danger)]">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--line)]" />
        </div>
        <span className="relative bg-[var(--color-cotton)] px-2.5 text-[0.8125rem] text-[var(--color-muted)]">
          Or continue with
        </span>
      </div>

      <GoogleLoginButton />

      <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-rule-2)] hover:decoration-[var(--color-accent)]">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
