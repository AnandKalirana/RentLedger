"use client";

import Link from "next/link";
import { Sparkles, Users, QrCode, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const demoTransactions = [
  { tenant: "Rahul Sharma (Sample)", amount: 18000, period: "08/2026", status: "VERIFIED" },
  { tenant: "Priya Patel (Sample)", amount: 22000, period: "08/2026", status: "PENDING" },
];

export function OnboardingBanner() {
  return (
    <div className="mt-6 space-y-6">
      {/* Onboarding Banner Card */}
      <div className="rounded-lg border border-[var(--stamp)] bg-[var(--stamp-soft)] p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[var(--stamp)] p-2 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Welcome to RentLedger!</h2>
              <p className="text-sm text-[var(--ink-soft)] mt-0.5">
                Complete these 3 simple steps to collect your first verified rent payment.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--line)] bg-white p-4">
            <div className="flex items-center gap-2 font-medium text-sm text-[var(--ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-semibold text-[var(--stamp)]">
                1
              </span>
              Add a Tenant
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Register monthly rent, due day, and tenant contact details.
            </p>
            <Link href="/tenants" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--stamp)] hover:underline">
              Go to Tenants <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-md border border-[var(--line)] bg-white p-4">
            <div className="flex items-center gap-2 font-medium text-sm text-[var(--ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-semibold text-[var(--stamp)]">
                2
              </span>
              Share Payment Link
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Copy your shareable payment link with your UPI QR embedded.
            </p>
            <Link href="/payment-links" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--stamp)] hover:underline">
              Payment Links <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-md border border-[var(--line)] bg-white p-4">
            <div className="flex items-center gap-2 font-medium text-sm text-[var(--ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-xs font-semibold text-[var(--stamp)]">
                3
              </span>
              Verify Payment
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Review payment proof uploaded by tenant and mark Verified.
            </p>
            <Link href="/payments" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--stamp)] hover:underline">
              View Payments <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Data Preview Section — auto-disappears when real data is added */}
      <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-raised)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 font-mono-data text-xs font-semibold uppercase text-amber-800">
              Demo Data Preview
            </span>
            <span className="text-xs text-[var(--ink-soft)]">
              (Will automatically disappear as soon as you add your first real tenant or payment)
            </span>
          </div>
          <Link href="/tenants">
            <Button size="sm">Add your first tenant</Button>
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-[var(--line)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--paper)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tenant (Sample)</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Period</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {demoTransactions.map((tx, idx) => (
                <tr key={idx} className="border-b border-[var(--line)] last:border-0 opacity-75">
                  <td className="px-4 py-2.5 font-medium text-[var(--ink)]">{tx.tenant}</td>
                  <td className="px-4 py-2.5 font-mono-data">₹{tx.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">{tx.period}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-[var(--stamp-soft)] text-[var(--stamp)]">
                      {tx.status}
                    </span>
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
