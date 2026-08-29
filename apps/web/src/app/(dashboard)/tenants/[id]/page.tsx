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
      <div className="mx-auto max-w-5xl px-8 py-8 space-y-4">
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
    return <div className="px-8 py-8 text-sm text-[var(--danger)]">{error ?? "Tenant not found"}</div>;

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{tenant.fullName}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge status={tenant.status} />
            <span className="text-sm text-[var(--ink-soft)]">{tenant.mobileNumber}</span>
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
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            {sendingReminder ? "Sending..." : "Send WhatsApp Reminder"}
            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <p className="text-xs text-[var(--ink-soft)] font-medium">Monthly rent</p>
          <p className="mt-1 font-mono-data text-lg font-semibold">
            ₹{tenant.monthlyRent.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <p className="text-xs text-[var(--ink-soft)] font-medium">Security deposit</p>
          <p className="mt-1 font-mono-data text-lg font-semibold">
            ₹{tenant.securityDeposit.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <p className="text-xs text-[var(--ink-soft)] font-medium">Move-in date & Rent Due Day</p>
          <p className="mt-1 font-mono-data text-lg font-semibold">
            {new Date(tenant.moveInDate).toLocaleDateString("en-IN")} (Day {tenant.rentDueDay})
          </p>
        </div>
      </div>

      {/* Feature 8: Lease Document Upload Section */}
      <div className="mt-6">
        <LeaseUpload tenantId={tenant.id} leaseUrl={tenant.leaseDocumentUrl} onUploaded={loadTenant} />
      </div>

      <h2 className="mt-8 text-base font-semibold">Payment history</h2>
      {tenant.payments.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-8 text-center text-sm text-[var(--ink-soft)]">
          No payments recorded yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--paper)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {tenant.payments.map((payment) => (
                <tr key={payment.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-mono-data">
                    {payment.billingMonth}/{payment.billingYear}
                  </td>
                  <td className="px-4 py-3 font-mono-data">₹{payment.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
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
