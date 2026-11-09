"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Plus, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { PaymentLinkDTO, TenantDTO } from "@rentledger/shared";

type LinkRow = PaymentLinkDTO & { tenant?: { fullName: string } | null };

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [linkType, setLinkType] = useState<"REUSABLE" | "TENANT_SPECIFIC">("REUSABLE");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [linksRes, tenantsRes] = await Promise.all([
      api.get<{ data: LinkRow[] }>("/payment-links"),
      api.get<{ data: TenantDTO[] }>("/tenants"),
    ]);
    setLinks(linksRes.data.data);
    setTenants(tenantsRes.data.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate() {
    await api.post("/payment-links", {
      type: linkType,
      tenantId: linkType === "TENANT_SPECIFIC" ? selectedTenantId : undefined,
    });
    setShowCreateModal(false);
    setSelectedTenantId("");
    await loadData();
  }

  async function handleDeactivate(id: string) {
    await api.patch(`/payment-links/${id}/deactivate`);
    await loadData();
  }

  function handleCopy(url: string, token: string) {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="ledger-head flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Payment links</h1>
          <p>Share a link so tenants can submit rent payment proof.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> New link
        </Button>
      </div>

      {loading && <SkeletonList lines={3} />}

      {!loading && links.length === 0 && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-10 text-center text-sm text-[var(--color-muted)]">
          No payment links yet. Create a reusable link, or a tenant-specific one if you&rsquo;d like
          their details pre-filled.
        </div>
      )}

      {!loading && links.length > 0 && (
        <div className="panel mt-6 divide-y divide-[var(--color-rule)]">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Link2 className={link.isActive ? "h-4 w-4 shrink-0 text-[var(--color-accent)]" : "h-4 w-4 shrink-0 text-[var(--color-muted)]"} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {link.type === "REUSABLE" ? "Reusable link" : `For ${link.tenant?.fullName ?? "tenant"}`}
                    {!link.isActive && <span className="ml-2 text-[0.8125rem] text-[var(--danger)]">(deactivated)</span>}
                  </p>
                  <p className="mt-0.5 break-all font-mono-data text-[0.8125rem] text-[var(--color-muted)]">{link.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleCopy(link.url, link.token)}>
                  <Copy className="h-3.5 w-3.5" /> {copiedToken === link.token ? "Copied" : "Copy"}
                </Button>
                {link.isActive && (
                  <Button variant="ghost" size="sm" onClick={() => handleDeactivate(link.id)}>
                    <XCircle className="h-3.5 w-3.5" /> Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <Modal title="New payment link" onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <Select
              label="Link type"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as "REUSABLE" | "TENANT_SPECIFIC")}
            >
              <option value="REUSABLE">Reusable: any tenant can use it</option>
              <option value="TENANT_SPECIFIC">Tenant-specific: pre-filled for one tenant</option>
            </Select>
            {linkType === "TENANT_SPECIFIC" && (
              <Select
                label="Tenant"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">Select a tenant…</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.fullName}
                  </option>
                ))}
              </Select>
            )}
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={linkType === "TENANT_SPECIFIC" && !selectedTenantId}
            >
              Create link
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
