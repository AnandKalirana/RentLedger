"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, ExternalLink, X } from "lucide-react";
import { api, resolveFileUrl } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { PaymentDTO, PaymentStatus } from "@rentledger/shared";

type TenantPayment = PaymentDTO & { tenant?: { fullName: string } };

const TABS: { label: string; value: PaymentStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PaymentStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function loadPayments() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab !== "ALL") params.status = tab;
      if (search.trim()) params.search = search.trim();
      const res = await api.get<{ data: { items: TenantPayment[] } }>("/payments", { params });
      setPayments(res.data.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadPayments, 250); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search]);

  async function handleVerify(id: string) {
    await api.patch(`/payments/${id}/verify`);
    await loadPayments();
  }

  async function handleReject() {
    if (!rejectingId || rejectReason.trim().length < 3) return;
    await api.patch(`/payments/${rejectingId}/reject`, { reason: rejectReason.trim() });
    setRejectingId(null);
    setRejectReason("");
    await loadPayments();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Review submitted proof and verify or reject each payment.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-[var(--line)] bg-[var(--paper-raised)] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={clsx(
                "rounded px-3 py-1.5 text-sm font-medium",
                tab === t.value
                  ? "bg-[var(--stamp-soft)] text-[var(--stamp)]"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile…"
          className="w-56 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
        />
      </div>

      {loading && <p className="mt-8 text-sm text-[var(--ink-soft)]">Loading…</p>}
      {error && !loading && <p className="mt-8 text-sm text-[var(--danger)]">{error}</p>}

      {!loading && !error && payments.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-10 text-center text-sm text-[var(--ink-soft)]">
          No payments here yet.
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="mt-6 space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.tenant?.fullName ?? payment.submittedName}</span>
                  <Badge status={payment.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  ₹{payment.amount.toLocaleString("en-IN")} · {payment.billingMonth}/{payment.billingYear} ·{" "}
                  submitted {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                </p>
                {payment.status === "REJECTED" && payment.rejectionReason && (
                  <p className="mt-1 text-xs text-[var(--danger)]">Reason: {payment.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolveFileUrl(payment.proofFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Proof
                </a>
                {payment.status === "PENDING" && (
                  <>
                    <Button size="sm" onClick={() => handleVerify(payment.id)}>
                      <Check className="h-4 w-4" /> Verify
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setRejectingId(payment.id)}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <Modal title="Reject payment" onClose={() => setRejectingId(null)}>
          <label className="block text-sm font-medium text-[var(--ink)]">Reason for rejection</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. Proof image doesn't match the expected amount"
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
          />
          <Button className="mt-4 w-full" onClick={handleReject} disabled={rejectReason.trim().length < 3}>
            Confirm rejection
          </Button>
        </Modal>
      )}
    </div>
  );
}
