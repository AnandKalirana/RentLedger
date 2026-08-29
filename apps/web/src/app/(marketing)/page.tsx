import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, FileDown, ShieldCheck, Users, QrCode, BellRing, ArrowRight } from "lucide-react";

const valueProps = [
  { label: "Direct UPI Collection", desc: "No gateway fees. Collect straight to your bank via your UPI QR." },
  { label: "Zero Auto-Approvals", desc: "You review and stamp every payment proof before marking paid." },
  { label: "Instant Statement Export", desc: "Download clean tenant payment histories as PDF statements." },
];

const features = [
  {
    icon: Users,
    title: "Tenant management",
    description:
      "Keep every tenant's rent, deposit, move-in date, and due day in one record — no more scattered notebooks or spreadsheets.",
  },
  {
    icon: QrCode,
    title: "UPI QR integration",
    description:
      "Generate tenant-specific or reusable payment links with your static UPI QR code embedded directly.",
  },
  {
    icon: ShieldCheck,
    title: "Payment verification",
    description:
      "Tenants submit proof against your UPI QR. You review it and stamp it PAID or REJECTED — nothing is marked paid automatically.",
  },
  {
    icon: CheckCircle2,
    title: "Real-time dues tracking",
    description:
      "See exactly who's paid, who's pending, and who's overdue this month — built from your actual payment records, not estimates.",
  },
  {
    icon: BellRing,
    title: "Automated WhatsApp reminders (Upcoming)",
    description:
      "Send payment due reminders directly to tenant's WhatsApp before due dates to eliminate follow-up hassle (Upcoming feature).",
  },
  {
    icon: FileDown,
    title: "Exportable records",
    description:
      "Generate a clean PDF of any tenant's payment history with calculated total sums for tax or ledger records.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your tenants",
    description: "Enter rent, deposit, move-in date, and due day once per tenant.",
  },
  {
    number: "02",
    title: "Share your payment link",
    description: "Tenants open it, see your UPI QR, and upload proof after paying.",
  },
  {
    number: "03",
    title: "Verify each submission",
    description: "Check the proof, then mark it verified or rejected — you stay in control.",
  },
  {
    number: "04",
    title: "Track and export",
    description: "Your dashboard and tenant history update instantly. Export to PDF anytime.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">RentLedger</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]">
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--stamp-soft)] bg-[var(--stamp-soft)] px-3 py-1 text-xs font-semibold text-[var(--stamp)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--stamp)] animate-pulse" />
              UPI Rent Collection + Dues Tracking
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Every rent payment,
              <br />
              verified and logged.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-soft)]">
              RentLedger gives landlords one place to manage tenants, collect rent through a
              shared UPI payment link, and verify every submission with complete proof.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-sm -rotate-2 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-md transition-transform hover:rotate-0">
              <div className="flex items-center justify-between border-b border-dashed border-[var(--line)] pb-3">
                <span className="text-sm font-medium">Payment record</span>
                <span className="font-mono-data text-xs text-[var(--ink-soft)]">#PL-2201</span>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">Tenant</dt>
                  <dd className="font-medium">A. Sharma</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">Rent due</dt>
                  <dd className="font-mono-data">₹18,000</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">Submitted</dt>
                  <dd className="font-mono-data">2 Jul, 10:14 AM</dd>
                </div>
              </dl>
              <div className="mt-6 flex justify-end">
                <span className="rotate-[-6deg] rounded border-2 border-[var(--stamp)] px-3 py-1 font-mono-data text-sm font-semibold tracking-wider text-[var(--stamp)]">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop Banner */}
      <section className="border-y border-[var(--line)] bg-[var(--paper-raised)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {valueProps.map((vp) => (
              <div key={vp.label} className="flex flex-col gap-1 border-l-2 border-[var(--stamp)] pl-4">
                <span className="font-medium text-[var(--ink)]">{vp.label}</span>
                <span className="text-sm text-[var(--ink-soft)]">{vp.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--paper)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight">Built around the way rent actually gets paid</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              No complex setup. Share your payment link, accept UPI payments, and keep audit-proof records.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-sm">
                <feature.icon className="h-6 w-6 text-[var(--stamp)]" strokeWidth={1.75} />
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[var(--line)] bg-[var(--paper-raised)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="border-t-2 border-[var(--stamp)] pt-4">
                <span className="font-mono-data text-xs text-[var(--ink-soft)]">{step.number}</span>
                <h3 className="mt-2 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Set up your first payment link today</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-soft)]">
            Add your tenants and start collecting verified rent payments in minutes.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/register">
              <Button size="lg">Create your free account</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-[var(--ink-soft)] sm:flex-row">
          <span>© {new Date().getFullYear()} RentLedger. All rights reserved.</span>
          <a href="mailto:support@rentledger.app" className="hover:text-[var(--ink)]">
            support@rentledger.app
          </a>
        </div>
      </footer>
    </main>
  );
}
