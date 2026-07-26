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
    <AuthCard title="Log in" subtitle="Welcome back — enter your details below.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Field
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        {serverError && <p className="text-sm text-[var(--danger)]">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--ink-soft)]">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-[var(--ink)] hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
