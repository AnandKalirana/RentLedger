"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { SkeletonStatGrid } from "@/components/ui/Skeleton";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { Badge } from "@/components/ui/Badge";
import type { DashboardSummaryDTO, TenantDTO } from "@rentledger/shared";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, error: queryError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardSummaryDTO }>("/dashboard/summary");
      return res.data.data;
    },
    refetchOnMount: "always",
  });

  // Use the tenant list as the definitive source-of-truth for whether the
  // landlord has any real data. The summary query can fail or be stale, but
  // /tenants is fast and always accurate.
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<{ data: TenantDTO[] }>("/tenants");
      return res.data.data;
    },
    refetchOnMount: "always",
  });

  const loading = summaryLoading || tenantsLoading;
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load dashboard") : null;

  // The banner disappears the moment at least one tenant exists.
  const hasRealData = tenants.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="ledger-head">
        <h1>Overview</h1>
        <p>A live summary of this month&apos;s rent collection.</p>
      </div>

      {/* Demo onboarding banner — shown only when no tenants exist yet */}
      {!loading && !hasRealData && <OnboardingBanner />}

      {loading && <SkeletonStatGrid />}

      {error && !summaryLoading && (
        <div role="alert" className="panel mt-8 p-6 text-sm text-[var(--color-muted)]">
          Dashboard summary is unavailable right now.
        </div>
      )}

      {summary && !summaryLoading && (
        <>
          <div className="panel mt-8 grid grid-cols-2 gap-px overflow-hidden bg-[var(--color-rule)] lg:grid-cols-4 [&>*]:bg-[var(--color-cotton)]">
            <StatCard label="Revenue this month" value={`₹${summary.currentMonthRevenue.toLocaleString("en-IN")}`} />
            <StatCard label="Pending verification" value={String(summary.pendingPaymentsCount)} />
            <StatCard label="Verified this month" value={String(summary.verifiedPaymentsCount)} />
            <StatCard label="Total dues outstanding" value={`₹${summary.totalDueAmount.toLocaleString("en-IN")}`} />
          </div>

          <h2 className="mt-10 text-lg">Recent transactions</h2>
          {summary.recentTransactions.length === 0 ? (
            <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-8 text-center text-sm text-[var(--color-muted)]">
              No payments submitted yet. Once tenants pay via a payment link, they&apos;ll appear here.
            </div>
          ) : (
            <div className="panel mt-3 overflow-x-auto">
              <table className="ledger-table" aria-label="Recent transactions">
                <tbody>
                  {summary.recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="whitespace-nowrap font-medium">{tx.tenantName}</td>
                      <td className="num">₹{tx.amount.toLocaleString("en-IN")}</td>
                      <td className="font-mono-data text-[var(--color-muted)]">
                        {tx.billingMonth}/{tx.billingYear}
                      </td>
                      <td>
                        <Badge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
