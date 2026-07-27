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
    const res = await api.get<{ data: Profile }>("/profile");
    setProfile(res.data.data);
    reset({
      fullName: res.data.data.fullName,
      businessName: res.data.data.businessName ?? "",
      phone: res.data.data.phone ?? "",
      upiId: res.data.data.upiId ?? "",
    });
    setLoading(false);
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

  if (loading) return <div className="px-8 py-8 text-sm text-[var(--ink-soft)]">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Your UPI QR code is shown on every payment link tenants use to pay you.
      </p>

      <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6">
        <h2 className="text-sm font-semibold">UPI QR code</h2>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Upload once — the same QR image is used across all your payment links.
        </p>
        <div className="mt-4 flex items-center gap-5">
          {profile?.upiQrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveFileUrl(profile.upiQrImageUrl)}
              alt="Your UPI QR code"
              className="h-32 w-32 rounded-md border border-[var(--line)] object-contain"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-md border border-dashed border-[var(--line)] text-xs text-[var(--ink-soft)]">
              No QR uploaded
            </div>
          )}
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm hover:border-[var(--stamp)]">
              <Upload className="h-4 w-4" />
              {qrUploading ? "Uploading…" : "Upload QR image"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleQrUpload}
                disabled={qrUploading}
              />
            </label>
            <p className="mt-1.5 text-xs text-[var(--ink-soft)]">JPG, PNG, or WEBP · max 5MB</p>
            {qrError && <p className="mt-1 text-xs text-[var(--danger)]">{qrError}</p>}
          </div>
        </div>
      </div>

      <form className="mt-6 space-y-4 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-sm font-semibold">Profile</h2>
        <Field label="Full name" {...register("fullName")} error={errors.fullName?.message} />
        <Field
          label="Business / display name (optional)"
          {...register("businessName")}
          error={errors.businessName?.message}
        />
        <Field label="Phone (optional)" {...register("phone")} error={errors.phone?.message} />
        <Field
          label="UPI ID"
          placeholder="yourname@bank"
          {...register("upiId")}
          error={errors.upiId?.message}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          {saveMessage && <span className="text-sm text-[var(--stamp)]">{saveMessage}</span>}
        </div>
      </form>
    </div>
  );
}
