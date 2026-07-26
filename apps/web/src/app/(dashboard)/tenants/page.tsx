"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { TenantForm, TenantFormValues } from "@/components/dashboard/TenantForm";
import type { TenantDTO } from "@rentledger/shared";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTenants() {
    setLoading(true);
    try {
      const res = await api.get<{ data: TenantDTO[] }>("/tenants");
      setTenants(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleCreate(values: TenantFormValues) {
    await api.post("/tenants", { ...values, email: values.email || undefined });
    setShowAddModal(false);
    await loadTenants();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this tenant? This won't delete their past payment records.")) return;
    await api.delete(`/tenants/${id}`);
    await loadTenants();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tenants</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Manage rent, deposits, and move-in details.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Add tenant
        </Button>
      </div>

      {loading && <p className="mt-8 text-sm text-[var(--ink-soft)]">Loading…</p>}
      {error && !loading && <p className="mt-8 text-sm text-[var(--danger)]">{error}</p>}

      {!loading && !error && tenants.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-10 text-center text-sm text-[var(--ink-soft)]">
          No tenants yet. Add your first tenant to start collecting rent.
        </div>
      )}

      {!loading && tenants.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--paper)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/tenants/${tenant.id}`} className="font-medium hover:underline">
                      {tenant.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{tenant.mobileNumber}</td>
                  <td className="px-4 py-3 font-mono-data">
                    ₹{tenant.monthlyRent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={tenant.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      aria-label="Delete tenant"
                      className="rounded p-1.5 text-[var(--ink-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <Modal title="Add tenant" onClose={() => setShowAddModal(false)}>
          <TenantForm onSubmit={handleCreate} submitLabel="Add tenant" />
        </Modal>
      )}
    </div>
  );
}
