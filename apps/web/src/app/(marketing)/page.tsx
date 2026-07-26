import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, FileDown, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Tenant management",
    description:
      "Keep every tenant's rent, deposit, move-in date, and due day in one record — no more scattered notebooks or spreadsheets.",
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
    icon: FileDown,
    title: "Exportable records",
    description:
      "Generate a clean PDF of any tenant's payment history for your own records or to share with them.",
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
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">RentLedger</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — signature element: a ledger-row "receipt" mimicking the actual
          verification flow, rotated slightly like a physical stamped slip. */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-widest text-[var(--stamp)]">
              Rent collection, on the record
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Every rent payment,
              <br />
              verified and logged.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-soft)]">
              RentLedger gives landlords one place to manage tenants, collect rent through a
              shared payment link, and verify every submission before it counts as paid.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href="/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-sm -rotate-2 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-sm">
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

      {/* Features */}
      <section className="border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Built around the way rent actually gets paid</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <feature.icon className="mt-1 h-5 w-5 shrink-0 text-[var(--stamp)]" strokeWidth={1.75} />
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
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
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Set up your first payment link today</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-soft)]">
            Add your tenants and start collecting verified rent payments in minutes.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/register">
              <Button size="lg">Get started</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-[var(--ink-soft)] sm:flex-row">
          <span>© {new Date().getFullYear()} RentLedger</span>
          <a href="mailto:support@rentledger.app" className="hover:text-[var(--ink)]">
            support@rentledger.app
          </a>
        </div>
      </footer>
    </main>
  );
}
