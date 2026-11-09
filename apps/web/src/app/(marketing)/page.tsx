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
    <main className="min-h-screen bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-rule)] bg-[var(--color-cotton)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Rent<span className="text-[var(--color-accent)]">Ledger</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="whitespace-nowrap rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)] active:bg-[var(--color-paper-3)]"
            >
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="ruled-paper border-b border-[var(--color-rule)]">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-mono-data text-[0.8125rem] font-medium text-[var(--color-accent-deep)]">
                UPI Rent Collection + Dues Tracking
              </p>
              <h1 className="mt-4 max-w-none text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.02]">
                Every rent payment,
                <br />
                verified and logged.
              </h1>
              <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-[var(--color-ink-2)]">
                RentLedger gives landlords one place to manage tenants, collect rent through a
                shared UPI payment link, and verify every submission with complete proof.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
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

            <div className="flex justify-center lg:justify-end">
              <div className="panel w-full max-w-sm -rotate-2 p-6 shadow-[var(--shadow-pop)] transition-transform duration-300 hover:rotate-0">
                <div className="flex items-center justify-between border-b-4 border-double border-[var(--color-rule-2)] pb-3">
                  <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">Payment record</span>
                  <span className="font-mono-data text-[0.8125rem] text-[var(--color-muted)]">#PL-2201</span>
                </div>
                <dl className="mt-5 space-y-3.5 text-sm">
                  <div className="flex justify-between gap-4 border-b border-dashed border-[var(--color-rule)] pb-3.5">
                    <dt className="text-[var(--color-muted)]">Tenant</dt>
                    <dd className="font-medium">A. Sharma</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-dashed border-[var(--color-rule)] pb-3.5">
                    <dt className="text-[var(--color-muted)]">Rent due</dt>
                    <dd className="font-mono-data">₹18,000</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">Submitted</dt>
                    <dd className="font-mono-data">2 Jul, 10:14 AM</dd>
                  </div>
                </dl>
                <div className="mt-7 flex justify-end">
                  <span className="inline-block rotate-[-6deg] rounded-md border-2 border-[var(--color-accent)] px-3 py-1 font-mono-data text-sm font-medium text-[var(--color-accent)] animate-[stampIn_0.5s_var(--ease-out)_0.35s_both]">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop Banner */}
      <section className="border-b border-[var(--color-rule)] bg-[var(--color-cotton)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid divide-y divide-[var(--color-rule)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {valueProps.map((vp) => (
              <div key={vp.label} className="flex flex-col gap-1.5 py-7 md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[var(--color-ink)]">{vp.label}</span>
                <span className="text-sm leading-relaxed text-[var(--color-muted)]">{vp.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-12 lg:self-start">
            <h2 className="max-w-[18ch] text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.08]">Built around the way rent actually gets paid</h2>
            <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-[var(--color-muted)]">
              No complex setup. Share your payment link, accept UPI payments, and keep audit-proof records.
            </p>
          </div>
          <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-4 py-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                  <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-base">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[var(--color-rule)] bg-[var(--color-cotton)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[clamp(1.7rem,3vw,2.3rem)]">How it works, in four steps</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step) => (
              <li key={step.number} className="border-t-2 border-[var(--color-ink)] pt-4">
                <span className="font-mono-data text-[0.8125rem] font-medium text-[var(--color-accent-deep)]">{step.number}</span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-base">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[var(--radius-card)] bg-[var(--color-ink)] [--color-focus:var(--color-focus-on-ink)] px-7 py-12 text-[var(--color-paper)] sm:px-12 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1] text-[var(--color-paper)]">Set up your first payment link today</h2>
            <p className="mt-3 max-w-md text-[0.95rem] text-[var(--color-paper-dim)]">
              Add your tenants and start collecting verified rent payments in minutes.
            </p>
          </div>
          <Link href="/register" className="shrink-0">
            <Button size="lg">Create your free account</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--color-rule)] bg-[var(--color-cotton)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[var(--color-muted)] sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} RentLedger. All rights reserved.</span>
          <a href="mailto:support@rentledger.app" className="underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline">
            support@rentledger.app
          </a>
        </div>
      </footer>
    </main>
  );
}
