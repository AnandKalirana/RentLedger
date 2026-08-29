"use client";

import { useState } from "react";
import { Plus, Check, Trash2, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { TenantDTO } from "@rentledger/shared";

interface MaintenanceRecordDTO {
  id: string;
  tenantId: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  notes?: string;
  createdAt: string;
  tenant?: {
    id: string;
    fullName: string;
    mobileNumber: string;
    monthlyMaintenance?: number;
  };
}

export default function MaintenancePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState("");

  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<{ data: TenantDTO[] }>("/tenants");
      return res.data.data;
    },
  });

  const { data: records = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["maintenance-records"],
    queryFn: async () => {
      const res = await api.get<{ data: MaintenanceRecordDTO[] }>("/maintenance");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTenantId || !amount) throw new Error("Select tenant and amount");
      await api.post("/maintenance", {
        tenantId: selectedTenantId,
        amount: Number(amount),
        billingMonth: Number(billingMonth),
        billingYear: Number(billingYear),
        notes: notes.trim() || undefined,
        status: "PENDING",
      });
    },
    onSuccess: () => {
      success("Maintenance record logged successfully");
      setShowAddModal(false);
      setSelectedTenantId("");
      setAmount("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to add record");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "VERIFIED" | "REJECTED" }) => {
      await api.patch(`/maintenance/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      success(`Maintenance marked as ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to update record");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/maintenance/${id}`);
    },
    onSuccess: () => {
      success("Record deleted");
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : "Failed to delete record");
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load records") : null;

  const totalCollected = records
    .filter((r) => r.status === "VERIFIED")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalPending = records
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Property Maintenance</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Track monthly maintenance fees separately from rent payments.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Log maintenance fee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <p className="text-xs text-[var(--ink-soft)] font-medium">Verified Maintenance Collected</p>
          <p className="mt-1 font-mono-data text-xl font-semibold text-[var(--stamp)]">
            ₹{totalCollected.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <p className="text-xs text-[var(--ink-soft)] font-medium">Pending Maintenance Dues</p>
          <p className="mt-1 font-mono-data text-xl font-semibold text-[var(--ink)]">
            ₹{totalPending.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {loading && <SkeletonList lines={4} />}
      {error && !loading && <p className="mt-8 text-sm text-[var(--danger)]">{error}</p>}

      {!loading && !error && records.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-10 text-center">
          <Wrench className="mx-auto h-8 w-8 text-[var(--ink-soft)]" />
          <p className="mt-2 text-sm font-medium text-[var(--ink)]">No maintenance records logged yet</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Log monthly maintenance fees per tenant/property to keep them separate from rent.
          </p>
          <Button className="mt-4" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Log first maintenance fee
          </Button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--paper)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-medium">{rec.tenant?.fullName ?? "Tenant"}</td>
                  <td className="px-4 py-3 font-mono-data">
                    {rec.billingMonth}/{rec.billingYear}
                  </td>
                  <td className="px-4 py-3 font-mono-data">₹{Number(rec.amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge status={rec.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{rec.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rec.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: rec.id, status: "VERIFIED" })}
                          disabled={statusMutation.isPending}
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Paid
                        </Button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this maintenance record?")) deleteMutation.mutate(rec.id);
                        }}
                        className="rounded p-1.5 text-[var(--ink-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        aria-label="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <Modal title="Log maintenance fee" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)]">Select Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  const t = tenants.find((item) => item.id === e.target.value);
                  if (t && t.monthlyMaintenance) {
                    setAmount(String(t.monthlyMaintenance));
                  }
                }}
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
              >
                <option value="">-- Select a tenant --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.mobileNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)]">Maintenance Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2000"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)]">Month</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)]">Year</label>
                <input
                  type="number"
                  value={billingYear}
                  onChange={(e) => setBillingYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)]">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Water bill & society maintenance"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--stamp)]"
              />
            </div>

            <Button
              className="w-full"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !selectedTenantId || !amount}
            >
              {createMutation.isPending ? "Logging..." : "Log maintenance fee"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
