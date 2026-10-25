# RentLedger

A multi-tenant SaaS platform for landlords to manage tenants, collect rent through a shared
UPI payment link, manually verify every payment before it counts as paid, and track everything
from a real-data dashboard, with a permission-aware AI assistant on top.

> Built as a full-stack portfolio project: Next.js frontend, Express/TypeScript API, PostgreSQL
> (with pgvector) via Prisma, JWT auth, and a security-first backend (rate limiting, input
> validation, scoped multi-tenancy, no fabricated demo numbers on the dashboard).

<!-- Add a screenshot or GIF walkthrough here (use seeded fake data only), e.g.: -->
<!-- ![Dashboard screenshot](./docs/screenshots/dashboard.png) -->

## Live demo

- Web app: https://rent-ledger-web-ten.vercel.app
- API: `https://your-api.onrender.com`
- Demo login: `demo@rentledger.local` / seeded password (see Setup)

## Why this exists

Small landlords in India typically track rent in a notebook or a shared spreadsheet and verify
UPI payments by eyeballing screenshots sent over WhatsApp. RentLedger gives them one place to do
that: onboard tenants once, share a payment link, review proof, and get a dashboard that only
ever reflects real, verified data, with no vanity numbers.

## Features

- **Auth**: email/password, bcrypt hashing, short-lived JWT access tokens + rotating hashed
  refresh tokens, httpOnly cookies
- **Tenant management**: add/edit/delete tenants, rent/deposit/move-in details, per-tenant
  profile with full payment history
- **Payment links**: reusable (any onboarded tenant can use it) or tenant-specific
  (pre-filled), each backed by an unguessable token
- **Public payment page**: tenant sees the landlord's UPI QR code (upload once in Settings,
  reused across every link) and submits a screenshot as proof
- **Verification panel**: filter by status, search, preview proof, verify or reject
  (rejection requires a reason). A payment only counts once a human confirms it
- **Dashboard**: this month's revenue, pending count, outstanding dues, recent transactions;
  every number is a live Prisma aggregate, nothing hardcoded
- **Notifications**: in-app bell (polls for new activity) + optional SMTP email to the
  landlord on submission and to the tenant on verify/reject
- **PDF export**: a bordered, statement-style payment history report per tenant
- **Settings**: profile fields and the single UPI QR image used across all payment links
- **Permission-aware AI Assistant (RAG)**: natural-language chat for landlords to query
  tenants and payments (e.g. *"What is Monika's monthly rent?"*, *"Why was the last payment
  rejected?"*). Tenant isolation and role-based visibility filtering are applied inside the
  database vector query, before anything reaches the LLM. Answers come with source citations.
- **Role-based access control**: `LANDLORD`, `MANAGER`, and `TENANT_VIEWER` role hierarchy
  carried in the JWT and enforced by `requireRole` middleware and by retrieval-time
  visibility filtering
- **Audit logging**: every AI assistant retrieval is recorded with actor, role, query, and the
  IDs of the records returned, viewable via `GET /api/audit-logs` (landlord only)
- **Swappable LLM/embedding providers**: Google Gemini, local Ollama, or a deterministic mock
  for tests, with automatic retry and backoff on rate limits (HTTP 429)
- **Automated tests (Vitest)**: isolation tests proving one landlord cannot read or modify
  another's data, and leakage tests covering vector retrieval boundaries, role filtering, and
  audit logging

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form + Zod |
| Backend | Express 4, TypeScript, Zod validation |
| Database | PostgreSQL + pgvector + Prisma ORM |
| RAG / vector store | pgvector (cosine similarity index) + `DocumentChunk` model |
| LLM / embeddings | Google Gemini (REST) / Ollama / Mock, selected by environment variable |
| Testing | Vitest + in-memory scoped mocks |
| Auth | JWT (access + rotating refresh), bcrypt, httpOnly cookies |
| File handling | Multer (local disk in dev; swappable for S3) |
| PDF | pdfkit |
| Email | Nodemailer (SMTP) |
| Monorepo | npm workspaces |

## Architecture

```
rentledger/
├── apps/
│   ├── api/          Express + TypeScript REST API (incl. rag/ module)
│   └── web/          Next.js (App Router) frontend
├── packages/
│   ├── database/     Prisma schema + client, shared by the API
│   └── shared/       Cross-app TypeScript types and constants
└── package.json      npm workspaces root
```

**Multi-tenancy model:** every Landlord is an isolated account. `Tenant`, `PaymentLink`, and
`Payment` all carry a direct `landlordId` foreign key, and every service function in
`apps/api/src/services/` takes `landlordId` explicitly and scopes its Prisma query by it
(see `tenant.service.ts` for the reference pattern). This is the core security property of the
whole app: one landlord can never read or modify another's data, enforced at the query layer,
not just at the route layer.

**RAG permission model:**

1. **Ingestion**: tenant profiles, payments, and rejection reasons are chunked and embedded.
   Every `DocumentChunk` carries `landlordId`, `tenantId`, and a `visibility` level. Chunks are
   re-ingested when the source record changes and removed when it is deleted.
2. **Retrieval**: the permission filter runs inside the SQL query (landlord scope + role
   visibility, then cosine-distance ordering), never after fetching. `landlordId` and role
   come only from the verified JWT, never from the request body.
3. **Generation**: the prompt is built only from retrieved chunks, which are treated as
   untrusted data rather than instructions. If nothing relevant is retrieved, the assistant
   says there is not enough data.
4. **Audit**: each retrieval writes an audit row with the actor, role, query, and returned
   chunk/source IDs.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14 with the **pgvector** extension available (on Supabase: Database →
  Extensions → enable `vector`)
- npm >= 9 (workspaces support)
- For the AI assistant: either a free Google Gemini API key (https://aistudio.google.com) or a
  local [Ollama](https://ollama.com) install

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

   **Supabase / pgbouncer note:** if you connect through the Supabase pooler, use a pooled
   `DATABASE_URL` ending in `?pgbouncer=true&connection_limit=1` (this avoids the
   `prepared statement already exists` error) and set a separate `DIRECT_URL` (direct,
   non-pooled connection) for migrations. Both URLs must be present in the `.env` of the API
   and the database package.

3. **Run database migrations:**
   ```bash
   # new or in-sync database
   npm run db:migrate

   # existing database (e.g. production, or one changed outside migrations)
   cd packages/database
   npx prisma migrate deploy
   npx prisma generate
   ```
   `prisma migrate dev` can demand a full schema reset if the database has drifted from the
   migration history. Use `migrate deploy` to apply pending migrations without losing data.

4. **Configure the AI assistant** in `apps/api/.env`:
   ```dotenv
   # gemini | ollama | mock  (mock is for tests only)
   EMBEDDING_PROVIDER=gemini
   LLM_PROVIDER=gemini
   EMBEDDING_DIM=768

   # Google Gemini
   GEMINI_API_KEY=your_key_here
   GEMINI_EMBED_MODEL=<current embedding model>
   GEMINI_CHAT_MODEL=<current Flash / Flash-Lite model>

   # Ollama (alternative, fully local)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_EMBED_MODEL=nomic-embed-text
   OLLAMA_CHAT_MODEL=llama3.2
   ```
   Gemini model names change over time. Check the currently available names in Google AI
   Studio and update the two `GEMINI_*_MODEL` values if you see 404 errors. Keep
   `EMBEDDING_DIM` equal to the dimension the embedding model actually returns (768 by
   default).

5. **Embed existing data** (run once after migrating, and again whenever you change the
   embedding provider or model, since vectors from different models are not comparable):
   ```bash
   npm run rag:backfill
   ```

6. **(Optional) Seed a dev login**: creates one landlord account from
   `SEED_LANDLORD_EMAIL` / `SEED_LANDLORD_PASSWORD`. Refuses to run when
   `NODE_ENV=production`, and never creates fake tenants or payments:
   ```bash
   npm run db:seed
   ```

7. **Start both apps** (two terminals):
   ```bash
   npm run dev:api    # http://localhost:4000
   npm run dev:web    # http://localhost:3000
   ```

8. Visit `http://localhost:3000`, register (or log in with the seeded account), upload a UPI QR
   in Settings, add a tenant, generate a payment link, and try the **AI Assistant** page.

## Useful scripts

| Command | Description |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Start each app in watch mode |
| `npm run dev` | Start both apps together |
| `npm run test` (in `apps/api`) | Run the Vitest isolation and leakage suites |
| `npm run db:migrate` | Apply Prisma migrations in development |
| `npm run db:studio` | Open Prisma Studio to inspect data |
| `npm run db:seed` | Seed a dev-only landlord login |
| `npm run rag:backfill` | Embed and index existing tenants and payments |
| `npm run build:api` / `npm run build:web` | Production builds |

## API reference

All authenticated routes expect the `accessToken` cookie (or `Authorization: Bearer <token>`).

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | none | Create a landlord account |
| POST | `/api/auth/login` | none | Log in |
| POST | `/api/auth/refresh` | cookie | Rotate access/refresh tokens |
| POST | `/api/auth/logout` | none | Revoke the current refresh token |
| GET | `/api/auth/me` | yes | Current landlord |
| GET/POST/PATCH/DELETE | `/api/tenants` | yes | Tenant CRUD (re-indexes vector chunks) |
| POST | `/api/payment-links` | yes | Create a REUSABLE or TENANT_SPECIFIC link |
| GET | `/api/payment-links` | yes | List links |
| PATCH | `/api/payment-links/:id/deactivate` | yes | Revoke a link |
| GET | `/api/public/payment-links/:token` | none | Tenant-facing link info (UPI details, prefill) |
| POST | `/api/public/payment-links/:token/submit` | none | Submit payment proof (rate-limited, multipart) |
| GET | `/api/payments` | yes | List payments (filter by `status`, `search`, paginated) |
| GET | `/api/payments/:id` | yes | Single payment |
| PATCH | `/api/payments/:id/verify` | yes | Mark VERIFIED (re-indexes vector chunks) |
| PATCH | `/api/payments/:id/reject` | yes | Mark REJECTED (indexes the rejection reason) |
| POST | `/api/assistant/chat` | yes | Permission-aware AI chat with source citations |
| GET | `/api/audit-logs` | yes (LANDLORD) | Paginated audit trail of assistant retrievals |
| GET | `/api/dashboard/summary` | yes | Real revenue/dues/pending aggregates |
| GET | `/api/exports/tenants/:id/pdf` | yes | Streams the tenant's payment history as a PDF |
| GET/PATCH | `/api/notifications` | yes | In-app notifications |
| GET/PATCH | `/api/profile` | yes | Landlord profile fields |
| POST | `/api/profile/qr-code` | yes | Upload the shared UPI QR image |

**How a payment gets linked to a tenant:** a `TENANT_SPECIFIC` link carries the `tenantId`
directly. A `REUSABLE` link has none: the submission is matched to an existing `Tenant` by the
mobile number the submitter enters, scoped to that landlord. If no match is found, submission is
rejected, so payments can never be created for a tenant the landlord hasn't onboarded.

## Testing

The Vitest suites in `apps/api` run fully offline using an in-memory Prisma mock and the mock
embedding/LLM providers (no real API calls):

- **Isolation tests**: prove landlord A cannot read, create, update, delete, verify, or reject
  landlord B's records.
- **Leakage tests**: prove vector retrieval never returns another landlord's chunks, that
  lower roles cannot retrieve higher-visibility chunks, and that every retrieval writes an
  audit row with the correct actor and chunk IDs.

## Security notes

- Passwords hashed with bcrypt (12 rounds); never logged or returned in API responses
- JWT access tokens (15 min) + rotating, hashed-at-rest refresh tokens (revocable)
- Auth cookies are `httpOnly`, `sameSite=lax`, and `secure` in production
- Every request body is validated with Zod before reaching a service function. Request data is
  never spread directly into a Prisma `create`/`update` call, which is what prevents
  privilege-escalation bugs like a client-supplied role field
- The AI assistant takes `landlordId` and role only from the verified token, filters inside the
  vector query, and treats retrieved content as untrusted data
- `helmet`, CORS locked to `CLIENT_URL`, per-route rate limiting (auth and the public
  payment-submission endpoint are the tightest limits)
- File uploads restricted to JPG/PNG/WEBP, capped at 5MB
- Static `/uploads` route explicitly sets `Cross-Origin-Resource-Policy: cross-origin` (these
  files are meant to be publicly viewable proof/QR images); every other response keeps helmet's
  stricter default

## Known limitations

- File storage is local disk in dev (`STORAGE_DRIVER=local`); swap in S3 for production (see
  `docs/DEPLOYMENT.md`) since most PaaS platforms wipe local disk on redeploy
- Only the `LANDLORD` role can log in today. `MANAGER` and `TENANT_VIEWER` are enforced and
  tested at the retrieval layer but are not yet exposed in the product UI
- The assistant uses top-k vector retrieval, which is unreliable for aggregate questions
  (totals, "who is overdue"). Those should be routed to scoped database queries
- With the Gemini free tier, request content may be used by Google to improve its products.
  Use seeded fake data for demos, and avoid real tenant data on free hosted tiers
- Single currency (INR) and single UPI QR per landlord account (not per-property)

## Roadmap / future scope

- [x] Automated tests (Vitest) for tenant isolation, retrieval leakage, role filtering, and
      audit logging
- [ ] Expose manager and viewer roles in the UI and invitation flow
- [ ] Route aggregate assistant questions (totals, overdue lists) to scoped Prisma queries
- [ ] Include `rentDueDay` and lease details in tenant chunks for due-date questions
- [ ] CI pipeline (GitHub Actions: lint + typecheck + test on push)
- [ ] Dashboard analytics: revenue-over-time and payment-status charts (recharts is already a
      dependency; the data is already there)
- [ ] Multi-property support (a landlord managing more than one property/unit)
- [ ] CSV export alongside the existing PDF export
- [ ] Recurring rent due reminders via a scheduled job (node-cron), a few days before each
      tenant's `rentDueDay`
- [ ] Tenant self-service view: a lightweight, magic-link read-only portal for tenants to see
      their own payment history without a full account
- [ ] S3 (or equivalent) file storage adapter for production deployments
- [ ] OpenAPI/Swagger spec generated from the existing Zod schemas

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for a full walkthrough (Postgres, API, and
frontend on free-tier hosting). When deploying the API, also set the AI assistant variables
(`EMBEDDING_PROVIDER`, `LLM_PROVIDER`, `EMBEDDING_DIM`, `GEMINI_API_KEY`, and the model names)
and the pooled `DATABASE_URL` / `DIRECT_URL` pair on your host.