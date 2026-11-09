"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, ExternalLink, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveFileUrl } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { PaymentDTO, PaymentStatus } from "@rentledger/shared";

type TenantPayment = PaymentDTO & { tenant?: { fullName: string } };

const TABS: { label: string; value: PaymentStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function PaymentsPage() {
  const [tab, setTab] = useState<PaymentStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["payments", tab, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (tab !== "ALL") params.status = tab;
      if (search.trim()) params.search = search.trim();
      const res = await api.get<{ data: { items: TenantPayment[] } }>("/payments", { params });
      return res.data.data.items;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/payments/${id}/verify`);
    },
    onSuccess: () => {
      success("Payment verified successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to verify payment");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/payments/${id}/reject`, { reason });
    },
    onSuccess: () => {
      success("Payment rejected");
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to reject payment");
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load payments") : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="ledger-head">
        <h1>Payments</h1>
        <p>Review submitted proof and verify or reject each payment.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-[var(--radius-input)] bg-[var(--color-paper-2)] p-1 shadow-[inset_0_0_0_1px_var(--color-rule)]">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              aria-pressed={tab === t.value}
              className={clsx(
                "h-8 shrink-0 rounded-md px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 active:translate-y-px",
                tab === t.value
                  ? "bg-[var(--color-cotton)] text-[var(--color-ink)] shadow-[var(--shadow-seg)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
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
          aria-label="Search payments"
          className="input w-full sm:w-64"
        />
      </div>

      {loading && <SkeletonList lines={4} />}
      {error && !loading && (
        <p role="alert" className="panel mt-8 p-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-10 text-center text-sm text-[var(--color-muted)]">
          No payments found for this criteria.
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="panel mt-6 divide-y divide-[var(--color-rule)]">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--color-paper-2)]/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.tenant?.fullName ?? payment.submittedName}</span>
                  <Badge status={payment.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  <span className="font-mono-data font-medium text-[var(--color-ink)]">₹{payment.amount.toLocaleString("en-IN")}</span> - {payment.billingMonth}/{payment.billingYear} - submitted {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                </p>
                {payment.status === "REJECTED" && payment.rejectionReason && (
                  <p className="mt-1 text-[0.8125rem] text-[var(--danger)]">Reason: {payment.rejectionReason}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={resolveFileUrl(payment.proofFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-input)] bg-[var(--color-cotton)] px-3 text-sm font-medium text-[var(--color-ink-2)] shadow-[var(--shadow-key)] transition-[background-color,transform] duration-150 hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:translate-y-px active:bg-[var(--color-paper-3)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Proof
                </a>
                {payment.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => verifyMutation.mutate(payment.id)}
                      disabled={verifyMutation.isPending}
                    >
                      <Check className="h-4 w-4" /> Verify
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRejectingId(payment.id)}
                      disabled={rejectMutation.isPending}
                    >
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
          <label htmlFor="reject-reason" className="block text-sm font-medium text-[var(--color-ink)]">Reason for rejection</label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. Proof image doesn't match the expected amount"
            className="input mt-1.5"
          />
          <Button
            className="mt-4 w-full"
            onClick={() => rejectMutation.mutate({ id: rejectingId, reason: rejectReason.trim() })}
            disabled={rejectReason.trim().length < 3 || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? "Confirming..." : "Confirm rejection"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
