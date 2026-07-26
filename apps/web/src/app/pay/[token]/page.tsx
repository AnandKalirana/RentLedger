"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, Upload } from "lucide-react";
import { api, apiOrigin } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

interface PublicLinkInfo {
  token: string;
  type: "REUSABLE" | "TENANT_SPECIFIC";
  landlord: { displayName: string; upiId: string | null; upiQrImageUrl: string | null };
  tenant: { id: string; fullName: string; mobileNumber: string; email: string | null; monthlyRent: number } | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PublicPaymentPage() {
  const params = useParams<{ token: string }>();
  const [info, setInfo] = useState<PublicLinkInfo | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const now = new Date();
  const [form, setForm] = useState({
    submittedName: "",
    submittedMobile: "",
    submittedEmail: "",
    amount: "",
    billingMonth: String(now.getMonth() + 1),
    billingYear: String(now.getFullYear()),
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    api
      .get<{ data: PublicLinkInfo }>(`/public/payment-links/${params.token}`)
      .then((res) => {
        const data = res.data.data;
        setInfo(data);
        if (data.tenant) {
          setForm((f) => ({
            ...f,
            submittedName: data.tenant!.fullName,
            submittedMobile: data.tenant!.mobileNumber,
            submittedEmail: data.tenant!.email ?? "",
            amount: String(data.tenant!.monthlyRent),
          }));
        }
        if (!data.landlord.upiQrImageUrl && data.landlord.upiId) {
          const upiUrl = `upi://pay?pa=${encodeURIComponent(data.landlord.upiId)}&pn=${encodeURIComponent(
            data.landlord.displayName
          )}&cu=INR`;
          QRCode.toDataURL(upiUrl, { margin: 1, width: 220 }).then(setQrDataUrl);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "This link isn't available"))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setSubmitError("Please attach a screenshot of your payment.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append("proof", file);
      await api.post(`/public/payment-links/${params.token}/submit`, body);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
      </main>
    );
  }

  if (error || !info) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
        <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 text-center text-sm text-[var(--ink-soft)]">
          {error ?? "This payment link isn't available."}
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
        <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--stamp)]" />
          <h1 className="mt-3 text-lg font-semibold">Payment submitted</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {info.landlord.displayName} will review your proof and verify the payment shortly.
          </p>
        </div>
      </main>
    );
  }

  const qrImage = info.landlord.upiQrImageUrl ? `${apiOrigin}${info.landlord.upiQrImageUrl}` : qrDataUrl;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6 py-10">
      <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6">
        <h1 className="text-lg font-semibold">{info.landlord.displayName}</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Pay rent via UPI, then submit proof below.</p>

        {qrImage && (
          <div className="mt-4 flex flex-col items-center rounded-md border border-dashed border-[var(--line)] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="UPI QR code" className="h-44 w-44" />
            {info.landlord.upiId && (
              <p className="mt-2 font-mono-data text-xs text-[var(--ink-soft)]">{info.landlord.upiId}</p>
            )}
          </div>
        )}

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <Field
            label="Your name"
            value={form.submittedName}
            onChange={(e) => setForm({ ...form, submittedName: e.target.value })}
            required
          />
          <Field
            label="Mobile number"
            value={form.submittedMobile}
            onChange={(e) => setForm({ ...form, submittedMobile: e.target.value })}
            required
          />
          <Field
            label="Email (optional)"
            type="email"
            value={form.submittedEmail}
            onChange={(e) => setForm({ ...form, submittedEmail: e.target.value })}
          />
          <Field
            label="Amount paid (₹)"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)]">Month</label>
              <select
                value={form.billingMonth}
                onChange={(e) => setForm({ ...form, billingMonth: e.target.value })}
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Year"
              type="number"
              value={form.billingYear}
              onChange={(e) => setForm({ ...form, billingYear: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)]">Payment screenshot</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--line)] bg-white px-3 py-4 text-sm text-[var(--ink-soft)] hover:border-[var(--stamp)]">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Choose an image (JPG, PNG, WEBP · max 5MB)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit payment"}
          </Button>
        </form>
      </div>
    </main>
  );
}
