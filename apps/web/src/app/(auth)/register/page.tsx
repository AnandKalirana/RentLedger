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
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
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
      await api.post("/auth/register", values);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start tracking rent for your properties.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Full name" {...register("fullName")} error={errors.fullName?.message} />
        <Field label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Field
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        {serverError && <p className="text-sm text-[var(--danger)]">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--ink-soft)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--ink)] hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
