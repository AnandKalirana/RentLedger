"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { TenantForm, TenantFormValues } from "@/components/dashboard/TenantForm";
import type { TenantDTO } from "@rentledger/shared";

export default function TenantsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<{ data: TenantDTO[] }>("/tenants");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TenantFormValues) => {
      await api.post("/tenants", { ...values, email: values.email || undefined });
    },
    onSuccess: () => {
      setShowAddModal(false);
      success("Tenant added successfully");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to add tenant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tenants/${id}`);
    },
    onSuccess: () => {
      success("Tenant removed");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to remove tenant");
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load tenants") : null;

  function handleCreate(values: TenantFormValues) {
    return createMutation.mutateAsync(values);
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this tenant? This won't delete their past payment records.")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="ledger-head flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Tenants</h1>
          <p>
            Manage rent, deposits, and move-in details.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Add tenant
        </Button>
      </div>

      {loading && <SkeletonList lines={4} />}
      {error && !loading && (
        <p role="alert" className="panel mt-8 p-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {!loading && !error && tenants.length === 0 && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">No tenants yet</p>
          <p className="mx-auto mt-1 text-sm text-[var(--color-muted)]">
            Add your first tenant to start collecting rent.
          </p>
          <Button className="mt-4" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add your first tenant
          </Button>
        </div>
      )}

      {!loading && tenants.length > 0 && (
        <div className="panel mt-6 overflow-x-auto">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th className="text-right">Rent</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <Link href={`/tenants/${tenant.id}`} className="whitespace-nowrap font-medium text-[var(--color-ink)] underline-offset-4 hover:text-[var(--color-accent-deep)] hover:underline">
                      {tenant.fullName}
                    </Link>
                  </td>
                  <td className="font-mono-data text-[var(--color-muted)]">{tenant.mobileNumber}</td>
                  <td className="num">
                    ₹{tenant.monthlyRent.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <Badge status={tenant.status} />
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      aria-label="Delete tenant"
                      className="rounded-md p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] active:bg-[var(--danger-soft)]"
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
