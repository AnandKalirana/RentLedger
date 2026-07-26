# RentLedger

A multi-tenant SaaS platform for landlords to manage tenants, collect rent through a shared
UPI payment link, manually verify every payment before it counts as paid, and track everything
from a real-data dashboard.

> Built as a full-stack portfolio project — Next.js frontend, Express/TypeScript API, PostgreSQL
> via Prisma, JWT auth, and a security-first backend (rate limiting, input validation, scoped
> multi-tenancy, no fabricated demo numbers on the dashboard).

<!-- Add a screenshot or GIF walkthrough here once deployed, e.g.: -->
<!-- ![Dashboard screenshot](./docs/screenshots/dashboard.png) -->

## Live demo

<!-- Add your deployed links here after following DEPLOYMENT.md -->
- Web app: `https://your-app.vercel.app`
- API: `https://your-api.onrender.com`
- Demo login: `demo@rentledger.local` / seeded password (see Setup)

## Why this exists

Small landlords in India typically track rent in a notebook or a shared spreadsheet and verify
UPI payments by eyeballing screenshots sent over WhatsApp. RentLedger gives them one place to do
that: onboard tenants once, share a payment link, review proof, and get a dashboard that only
ever reflects real, verified data — no vanity numbers.

## Features

- **Auth** — email/password, bcrypt hashing, short-lived JWT access tokens + rotating hashed
  refresh tokens, httpOnly cookies
- **Tenant management** — add/edit/delete tenants, rent/deposit/move-in details, per-tenant
  profile with full payment history
- **Payment links** — reusable (any onboarded tenant can use it) or tenant-specific
  (pre-filled), each backed by an unguessable token
- **Public payment page** — tenant sees the landlord's UPI QR code (upload once in Settings,
  reused across every link) and submits a screenshot as proof
- **Verification panel** — filter by status, search, preview proof, verify or reject
  (rejection requires a reason) — a payment only counts once a human confirms it
- **Dashboard** — this month's revenue, pending count, outstanding dues, recent transactions —
  every number is a live Prisma aggregate, nothing hardcoded
- **Notifications** — in-app bell (polls for new activity) + optional SMTP email to the
  landlord on submission and to the tenant on verify/reject
- **PDF export** — a bordered, statement-style payment history report per tenant
- **Settings** — profile fields and the single UPI QR image used across all payment links

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form + Zod |
| Backend | Express 4, TypeScript, Zod validation |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + rotating refresh), bcrypt, httpOnly cookies |
| File handling | Multer (local disk in dev; swappable for S3) |
| PDF | pdfkit |
| Email | Nodemailer (SMTP) |
| Monorepo | npm workspaces |

## Architecture

```
rentledger/
├── apps/
│   ├── api/          Express + TypeScript REST API
│   └── web/           Next.js (App Router) frontend
├── packages/
│   ├── database/       Prisma schema + client, shared by the API
│   └── shared/         Cross-app TypeScript types and constants
└── package.json         npm workspaces root
```

**Multi-tenancy model:** every Landlord is an isolated account. `Tenant`, `PaymentLink`, and
`Payment` all carry a direct `landlordId` foreign key, and every service function in
`apps/api/src/services/` takes `landlordId` explicitly and scopes its Prisma query by it —
see `tenant.service.ts` for the reference pattern. This is the core security property of the
whole app: one landlord can never read or modify another's data, enforced at the query layer,
not just at the route layer.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14 (local install, or a hosted instance — see `docs/DEPLOYMENT.md`)
- npm >= 9 (workspaces support)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp packages/database/.env.example packages/database/.env
   ```
   Set a real `DATABASE_URL` in `apps/api/.env` and `packages/database/.env`, and generate
   strong random values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET`
   (e.g. `openssl rand -hex 32`). **Never commit `.env` files.**

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **(Optional) Seed a dev login** — creates one landlord account from
   `SEED_LANDLORD_EMAIL` / `SEED_LANDLORD_PASSWORD`. Refuses to run when
   `NODE_ENV=production`, and never creates fake tenants or payments:
   ```bash
   npm run db:seed
   ```

5. **Start both apps** (two terminals):
   ```bash
   npm run dev:api    # http://localhost:4000
   npm run dev:web     # http://localhost:3000
   ```

6. Visit `http://localhost:3000`, register (or log in with the seeded account), upload a UPI QR
   in Settings, add a tenant, and generate a payment link.

## Useful scripts

| Command | Description |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Start each app in watch mode |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:studio` | Open Prisma Studio to inspect data |
| `npm run db:seed` | Seed a dev-only landlord login |
| `npm run build:api` / `npm run build:web` | Production builds |

## API reference

All authenticated routes expect the `accessToken` cookie (or `Authorization: Bearer <token>`).

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create a landlord account |
| POST | `/api/auth/login` | — | Log in |
| POST | `/api/auth/refresh` | cookie | Rotate access/refresh tokens |
| POST | `/api/auth/logout` | — | Revoke the current refresh token |
| GET | `/api/auth/me` | ✓ | Current landlord |
| GET/POST/PATCH/DELETE | `/api/tenants` | ✓ | Tenant CRUD |
| POST | `/api/payment-links` | ✓ | Create a REUSABLE or TENANT_SPECIFIC link |
| GET | `/api/payment-links` | ✓ | List links |
| PATCH | `/api/payment-links/:id/deactivate` | ✓ | Revoke a link |
| GET | `/api/public/payment-links/:token` | — | Tenant-facing link info (UPI details, prefill) |
| POST | `/api/public/payment-links/:token/submit` | — | Submit payment proof (rate-limited, multipart) |
| GET | `/api/payments` | ✓ | List payments (filter by `status`, `search`, paginated) |
| GET | `/api/payments/:id` | ✓ | Single payment |
| PATCH | `/api/payments/:id/verify` | ✓ | Mark VERIFIED |
| PATCH | `/api/payments/:id/reject` | ✓ | Mark REJECTED (requires `reason`) |
| GET | `/api/dashboard/summary` | ✓ | Real revenue/dues/pending aggregates |
| GET | `/api/exports/tenants/:id/pdf` | ✓ | Streams the tenant's payment history as a PDF |
| GET/PATCH | `/api/notifications` | ✓ | In-app notifications |
| GET/PATCH | `/api/profile` | ✓ | Landlord profile fields |
| POST | `/api/profile/qr-code` | ✓ | Upload the shared UPI QR image |

**How a payment gets linked to a tenant:** a `TENANT_SPECIFIC` link carries the `tenantId`
directly. A `REUSABLE` link has none — the submission is matched to an existing `Tenant` by the
mobile number the submitter enters, scoped to that landlord. If no match is found, submission is
rejected — payments can never be created for a tenant the landlord hasn't onboarded.

## Security notes

- Passwords hashed with bcrypt (12 rounds); never logged or returned in API responses
- JWT access tokens (15 min) + rotating, hashed-at-rest refresh tokens (revocable)
- Auth cookies are `httpOnly`, `sameSite=lax`, and `secure` in production
- Every request body is validated with Zod before reaching a service function — request data is
  never spread directly into a Prisma `create`/`update` call, which is what prevents
  privilege-escalation bugs like a client-supplied role field
- `helmet`, CORS locked to `CLIENT_URL`, per-route rate limiting (auth and the public
  payment-submission endpoint are the tightest limits)
- File uploads restricted to JPG/PNG/WEBP, capped at 5MB
- Static `/uploads` route explicitly sets `Cross-Origin-Resource-Policy: cross-origin` (these
  files are meant to be publicly viewable proof/QR images); every other response keeps helmet's
  stricter default

## Known limitations

- File storage is local disk in dev (`STORAGE_DRIVER=local`); swap in S3 for production (see
  `docs/DEPLOYMENT.md`) since most PaaS platforms wipe local disk on redeploy
- No automated test suite yet (see Roadmap)
- Single currency (INR) and single UPI QR per landlord account (not per-property)

## Roadmap / future scope

- [ ] Automated tests (Jest/Vitest) for auth, tenant-scoping, and the payment verification state
      machine — the highest-value addition for a portfolio review
- [ ] CI pipeline (GitHub Actions: lint + typecheck + test on push)
- [ ] Dashboard analytics — revenue-over-time and payment-status charts (recharts is already a
      dependency; the data is already there)
- [ ] Multi-property support (a landlord managing more than one property/unit)
- [ ] CSV export alongside the existing PDF export
- [ ] Recurring rent due reminders via a scheduled job (node-cron), a few days before each
      tenant's `rentDueDay`
- [ ] Tenant self-service view — a lightweight, magic-link read-only portal for tenants to see
      their own payment history without a full account
- [ ] S3 (or equivalent) file storage adapter for production deployments
- [ ] OpenAPI/Swagger spec generated from the existing Zod schemas

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for a full walkthrough (Postgres, API, and
frontend on free-tier hosting).
