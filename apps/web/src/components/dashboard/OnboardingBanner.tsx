"use client";

import Link from "next/link";
import { Sparkles, Users, QrCode, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const demoTransactions = [
  { tenant: "Rahul Sharma (Sample)", amount: 18000, period: "08/2026", status: "VERIFIED" },
  { tenant: "Priya Patel (Sample)", amount: 22000, period: "08/2026", status: "PENDING" },
];

export function OnboardingBanner() {
  return (
    <div className="mt-6 space-y-6">
      {/* Onboarding Banner Card */}
      <div className="panel overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-rule)] bg-[var(--color-accent-soft)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[var(--stamp)] p-2 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg text-[var(--color-ink)]">Welcome to RentLedger!</h2>
              <p className="mt-0.5 text-sm text-[var(--color-ink-2)]">
                Complete these 3 simple steps to collect your first verified rent payment.
              </p>
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-[var(--color-rule)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink)]">
              <span className="font-mono-data flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-medium text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
                1
              </span>
              Add a Tenant
            </div>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-muted)]">
              Register monthly rent, due day, and tenant contact details.
            </p>
            <Link href="/tenants" className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-[var(--color-accent-deep)] hover:underline">
              Go to Tenants <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink)]">
              <span className="font-mono-data flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-medium text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
                2
              </span>
              Share Payment Link
            </div>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-muted)]">
              Copy your shareable payment link with your UPI QR embedded.
            </p>
            <Link href="/payment-links" className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-[var(--color-accent-deep)] hover:underline">
              Payment Links <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink)]">
              <span className="font-mono-data flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-medium text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
                3
              </span>
              Verify Payment
            </div>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-muted)]">
              Review payment proof uploaded by tenant and mark Verified.
            </p>
            <Link href="/payments" className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-[var(--color-accent-deep)] hover:underline">
              View Payments <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Data Preview Section — auto-disappears when real data is added */}
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-rule-2)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--color-warn-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-warn)]">
              Demo Data Preview
            </span>
            <span className="text-[0.8125rem] text-[var(--color-muted)]">
              (Will automatically disappear as soon as you add your first real tenant or payment)
            </span>
          </div>
          <Link href="/tenants">
            <Button size="sm">Add your first tenant</Button>
          </Link>
        </div>

        <div className="panel mt-4 overflow-x-auto opacity-80">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Tenant (Sample)</th>
                <th className="text-right">Amount</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoTransactions.map((tx, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-[var(--color-ink)]">{tx.tenant}</td>
                  <td className="num">₹{tx.amount.toLocaleString("en-IN")}</td>
                  <td className="font-mono-data text-[var(--color-muted)]">{tx.period}</td>
                  <td>
                    <Badge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
