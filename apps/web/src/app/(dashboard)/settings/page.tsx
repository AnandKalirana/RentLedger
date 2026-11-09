"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { api, resolveFileUrl } from "@/lib/api";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Profile {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phone: string | null;
  upiId: string | null;
  upiQrImageUrl: string | null;
}

const schema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  upiId: z
    .string()
    .regex(/^[\w.+-]{2,256}@[A-Za-z]{2,64}$/, "Enter a valid UPI ID, e.g. name@bank")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Profile }>("/profile");
      setProfile(res.data.data);
      reset({
        fullName: res.data.data.fullName,
        businessName: res.data.data.businessName ?? "",
        phone: res.data.data.phone ?? "",
        upiId: res.data.data.upiId ?? "",
      });
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    setSaveMessage(null);
    await api.patch("/profile", values);
    setSaveMessage("Saved.");
    setTimeout(() => setSaveMessage(null), 2000);
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError(null);
    setQrUploading(true);
    try {
      const body = new FormData();
      body.append("qrImage", file);
      const res = await api.post<{ data: Profile }>("/profile/qr-code", body);
      setProfile(res.data.data);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setQrUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading)
    return (
      <div role="status" className="px-4 py-6 text-sm text-[var(--color-muted)] sm:px-8 sm:py-8">
        Loading…
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="ledger-head">
        <h1>Settings</h1>
        <p>Your UPI QR code is shown on every payment link tenants use to pay you.</p>
      </div>

      <div className="panel mt-8 p-6">
        <h2 className="text-base">UPI QR code</h2>
        <p className="mt-1 text-[0.8125rem] text-[var(--color-muted)]">
          Upload once: the same QR image is used across all your payment links.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {profile?.upiQrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveFileUrl(profile.upiQrImageUrl)}
              alt="Your UPI QR code"
              className="h-32 w-32 rounded-[var(--radius-input)] border border-[var(--color-rule)] bg-[var(--color-cotton)] object-contain p-1"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-[var(--radius-input)] border border-dashed border-[var(--color-rule-2)] text-center text-[0.8125rem] text-[var(--color-muted)]">
              No QR uploaded
            </div>
          )}
          <div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-cotton)] px-3.5 text-sm font-medium text-[var(--color-ink)] shadow-[var(--shadow-key)] transition-[background-color,transform] duration-150 hover:bg-[var(--color-paper-2)] active:translate-y-px active:bg-[var(--color-paper-3)] focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2">
              <Upload className="h-4 w-4" />
              {qrUploading ? "Uploading…" : "Upload QR image"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleQrUpload}
                className="hidden"
              />
            </label>
            {qrError && (
              <p role="alert" className="mt-2 text-[0.8125rem] text-[var(--danger)]">{qrError}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Field label="Full name" {...register("fullName")} error={errors.fullName?.message} />
        <Field label="Business name (optional)" {...register("businessName")} error={errors.businessName?.message} />
        <Field label="Phone (optional)" {...register("phone")} error={errors.phone?.message} />
        <Field label="UPI ID" placeholder="yourname@bank" {...register("upiId")} error={errors.upiId?.message} />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          {saveMessage && (
            <span role="status" className="text-sm text-[var(--color-muted)]">{saveMessage}</span>
          )}
        </div>
      </form>
    </div>
  );
}