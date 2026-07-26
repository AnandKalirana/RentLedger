"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { TenantDTO } from "@rentledger/shared";

const schema = z.object({
  fullName: z.string().min(2, "Enter the tenant's name"),
  mobileNumber: z.string().min(7, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  monthlyRent: z.coerce.number().positive("Enter the monthly rent"),
  securityDeposit: z.coerce.number().min(0).default(0),
  moveInDate: z.string().min(1, "Select a move-in date"),
  rentDueDay: z.coerce.number().int().min(1).max(31).default(1),
  notes: z.string().optional(),
});

export type TenantFormValues = z.infer<typeof schema>;

export function TenantForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save tenant",
}: {
  defaultValues?: Partial<TenantDTO>;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      mobileNumber: defaultValues?.mobileNumber ?? "",
      email: defaultValues?.email ?? "",
      monthlyRent: defaultValues?.monthlyRent ?? undefined,
      securityDeposit: defaultValues?.securityDeposit ?? 0,
      moveInDate: defaultValues?.moveInDate?.slice(0, 10) ?? "",
      rentDueDay: defaultValues?.rentDueDay ?? 1,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Full name" {...register("fullName")} error={errors.fullName?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile number" {...register("mobileNumber")} error={errors.mobileNumber?.message} />
        <Field label="Email (optional)" type="email" {...register("email")} error={errors.email?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Monthly rent (₹)"
          type="number"
          step="0.01"
          {...register("monthlyRent")}
          error={errors.monthlyRent?.message}
        />
        <Field
          label="Security deposit (₹)"
          type="number"
          step="0.01"
          {...register("securityDeposit")}
          error={errors.securityDeposit?.message}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Move-in date" type="date" {...register("moveInDate")} error={errors.moveInDate?.message} />
        <Field
          label="Rent due day"
          type="number"
          min={1}
          max={31}
          {...register("rentDueDay")}
          error={errors.rentDueDay?.message}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)]">Notes (optional)</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
