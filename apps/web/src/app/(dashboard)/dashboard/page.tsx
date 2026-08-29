"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { SkeletonStatGrid } from "@/components/ui/Skeleton";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
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
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        A live summary of this month&apos;s rent collection.
      </p>

      {/* Demo onboarding banner — shown only when no tenants exist yet */}
      {!loading && !hasRealData && <OnboardingBanner />}

      {loading && <SkeletonStatGrid />}

      {error && !summaryLoading && (
        <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 text-sm text-[var(--ink-soft)]">
          Dashboard summary is unavailable right now.
        </div>
      )}

      {summary && !summaryLoading && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue this month" value={`₹${summary.currentMonthRevenue.toLocaleString("en-IN")}`} />
            <StatCard label="Pending verification" value={String(summary.pendingPaymentsCount)} />
            <StatCard label="Verified this month" value={String(summary.verifiedPaymentsCount)} />
            <StatCard label="Total dues outstanding" value={`₹${summary.totalDueAmount.toLocaleString("en-IN")}`} />
          </div>

          <h2 className="mt-10 text-base font-semibold">Recent transactions</h2>
          {summary.recentTransactions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-8 text-center text-sm text-[var(--ink-soft)]">
              No payments submitted yet. Once tenants pay via a payment link, they&apos;ll appear here.
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]">
              <table className="w-full text-sm">
                <tbody>
                  {summary.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-3 font-medium">{tx.tenantName}</td>
                      <td className="px-4 py-3 font-mono-data">₹{tx.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        {tx.billingMonth}/{tx.billingYear}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">{tx.status}</td>
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
