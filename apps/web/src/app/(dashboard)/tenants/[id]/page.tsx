"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Pencil, MessageSquare } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { LeaseUpload } from "@/components/dashboard/LeaseUpload";
import { TenantForm, TenantFormValues } from "@/components/dashboard/TenantForm";
import type { PaymentDTO, TenantDTO } from "@rentledger/shared";

type TenantWithPayments = TenantDTO & {
  leaseDocumentUrl?: string | null;
  monthlyMaintenance?: number | null;
  payments: PaymentDTO[];
};

export default function TenantProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantWithPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const { success, error: showError } = useToast();

  async function loadTenant() {
    setLoading(true);
    try {
      const res = await api.get<{ data: TenantWithPayments }>(`/tenants/${params.id}`);
      setTenant(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleUpdate(values: TenantFormValues) {
    await api.patch(`/tenants/${params.id}`, { ...values, email: values.email || undefined });
    setShowEditModal(false);
    success("Tenant updated successfully");
    await loadTenant();
  }

  async function handleSendWhatsAppReminder() {
    if (!tenant) return;
    setSendingReminder(true);
    try {
      await api.post("/notifications/reminders/send", {
        mobileNumber: tenant.mobileNumber,
        tenantName: tenant.fullName,
        amount: tenant.monthlyRent,
        rentDueDay: tenant.rentDueDay,
      });
      success(`WhatsApp reminder sent to ${tenant.mobileNumber} (Upcoming feature preview)`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to send WhatsApp reminder");
    } finally {
      setSendingReminder(false);
    }
  }

  function handleDownloadPdf() {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/exports/tenants/${params.id}/pdf`, "_blank");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-8 sm:py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error || !tenant)
    return (
      <div role="alert" className="px-4 py-6 text-sm text-[var(--danger)] sm:px-8 sm:py-8">
        {error ?? "Tenant not found"}
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <div className="ledger-head mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{tenant.fullName}</h1>
          <div className="mt-2 flex items-center gap-2.5">
            <Badge status={tenant.status} />
            <span className="font-mono-data text-sm text-[var(--color-muted)]">{tenant.mobileNumber}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSendWhatsAppReminder}
            disabled={sendingReminder}
            title="Upcoming Feature — WhatsApp Cloud API Preview"
          >
            <MessageSquare className="h-4 w-4 text-[var(--color-accent)]" />
            {sendingReminder ? "Sending..." : "Send WhatsApp Reminder"}
            <span className="ml-1.5 rounded bg-[var(--color-warn-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-warn)] ring-1 ring-inset ring-[var(--color-warn)]/25">
              Upcoming
            </span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="panel mt-6 grid gap-px overflow-hidden bg-[var(--color-rule)] sm:grid-cols-3 [&>*]:bg-[var(--color-cotton)]">
        <div className="p-5">
          <p className="text-[0.8125rem] font-medium text-[var(--color-muted)]">Monthly rent</p>
          <p className="mt-1.5 font-mono-data text-xl font-medium">
            ₹{tenant.monthlyRent.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[0.8125rem] font-medium text-[var(--color-muted)]">Security deposit</p>
          <p className="mt-1.5 font-mono-data text-xl font-medium">
            ₹{tenant.securityDeposit.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[0.8125rem] font-medium text-[var(--color-muted)]">Move-in date & Rent Due Day</p>
          <p className="mt-1.5 font-mono-data text-xl font-medium">
            {new Date(tenant.moveInDate).toLocaleDateString("en-IN")} (Day {tenant.rentDueDay})
          </p>
        </div>
      </div>

      {/* Feature 8: Lease Document Upload Section */}
      <div className="mt-6">
        <LeaseUpload tenantId={tenant.id} leaseUrl={tenant.leaseDocumentUrl} onUploaded={loadTenant} />
      </div>

      <h2 className="mt-10 text-lg">Payment history</h2>
      {tenant.payments.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-8 text-center text-sm text-[var(--color-muted)]">
          No payments recorded yet.
        </div>
      ) : (
        <div className="panel mt-4 overflow-x-auto">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {tenant.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="font-mono-data">
                    {payment.billingMonth}/{payment.billingYear}
                  </td>
                  <td className="num">₹{payment.amount.toLocaleString("en-IN")}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                  <td className="font-mono-data text-[var(--color-muted)]">
                    {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && (
        <Modal title="Edit tenant" onClose={() => setShowEditModal(false)}>
          <TenantForm defaultValues={tenant} onSubmit={handleUpdate} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  );
}
