"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import type { DashboardSummaryDTO } from "@rentledger/shared";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: DashboardSummaryDTO }>("/dashboard/summary")
      .then((res) => setSummary(res.data.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        A live summary of this month's rent collection.
      </p>

      {loading && <p className="mt-8 text-sm text-[var(--ink-soft)]">Loading…</p>}

      {error && !loading && (
        <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 text-sm text-[var(--ink-soft)]">
          Dashboard data isn't available yet — the summary endpoint is scaffolded in the API and
          will return real figures once implemented.
        </div>
      )}

      {summary && !loading && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue this month" value={`₹${summary.currentMonthRevenue.toLocaleString("en-IN")}`} />
            <StatCard label="Pending verification" value={String(summary.pendingPaymentsCount)} />
            <StatCard label="Verified this month" value={String(summary.verifiedPaymentsCount)} />
            <StatCard label="Total dues outstanding" value={`₹${summary.totalDueAmount.toLocaleString("en-IN")}`} />
          </div>

          <h2 className="mt-10 text-base font-semibold">Recent transactions</h2>
          {summary.recentTransactions.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">No payments submitted yet.</p>
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
