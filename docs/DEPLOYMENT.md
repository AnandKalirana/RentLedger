# Deployment guide — Supabase + Render + Vercel

| Piece | Host | Purpose |
|---|---|---|
| PostgreSQL | [Supabase](https://supabase.com) | Managed Postgres, free tier |
| API (Express) | [Render](https://render.com) | Web service, free/cheap tier |
| Web (Next.js) | [Vercel](https://vercel.com) | Built for Next.js, zero-config |

## 1. Database — Supabase

1. Create a free project at supabase.com. Pick a strong database password when prompted (save it).
2. Go to **Project Settings → Database → Connection string**.
3. You need **two** connection strings from this page:
   - **Transaction pooler** (port `6543`) — used by your running app for normal queries.
     Copy it and append `?pgbouncer=true` to the end if it isn't already there.
   - **Direct connection** (port `5432`) — used only for running migrations.
   Both look like:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:5432/postgres
   ```
4. Apply the two schema changes above (`schema.prisma` datasource block + env templates) before continuing —
   without `directUrl`, `prisma migrate` will fail or hang when run through the pooler.
5. Run migrations against Supabase from your local machine:
   ```bash
   cd packages/database
   # .env in this folder should have both DATABASE_URL and DIRECT_URL set to the Supabase values
   npx prisma migrate deploy
   ```

## 2. API — Render

1. Push this repo to GitHub first (see Git commands below) if you haven't.
2. On Render: **New → Web Service**, connect your GitHub repo.
3. **Root directory:** `apps/api`
4. **Build command:**
   ```
   cd ../.. && npm install && npm run db:generate --workspace=packages/database && npm run build:api
   ```
5. **Start command:**
   ```
   node ../../apps/api/dist/server.js
   ```
   (If Render's working directory ends up being `apps/api` already, just use `node dist/server.js`.)
6. **Environment variables** — set every key from `apps/api/.env.example`, in particular:
   - `DATABASE_URL` → the Supabase **pooler** URL (port 6543, with `?pgbouncer=true`)
   - `DIRECT_URL` → the Supabase **direct** URL (port 5432) — Prisma Client needs this present
     even at runtime alongside `DATABASE_URL`, since the schema references both
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` → generate with
     `openssl rand -hex 32` (three different values)
   - `CLIENT_URL` → your Vercel URL (set this after step 3, then redeploy)
   - `NODE_ENV=production`
   - `STORAGE_DRIVER=local` works for a demo, but **Render's free tier wipes local disk on every
     redeploy** — uploaded proof/QR images will disappear. Supabase also offers Storage
     (S3-compatible) if you want persistent uploads; that requires swapping
     `middleware/upload.ts`'s disk storage for an S3-compatible client — ask if you want this
     built out.
   - SMTP vars if you want email notifications live
7. Confirm `https://<your-render-url>.onrender.com/health` returns `{"status":"ok"}`.

## 3. Web — Vercel

1. On Vercel: **Add New → Project**, import the same GitHub repo.
2. **Root directory:** `apps/web`
3. **Framework preset:** Next.js (auto-detected)
4. **Environment variable:**
   - `NEXT_PUBLIC_API_URL` → `https://<your-render-url>.onrender.com/api`
5. Deploy. Vercel gives you a URL like `https://rentledger.vercel.app`.
6. **Go back to Render**, set `CLIENT_URL` to this exact Vercel URL, and redeploy the API —
   CORS is locked to `CLIENT_URL`, so this step is required or every request gets blocked.

## 4. Verify end-to-end

1. Visit your Vercel URL, register a landlord account.
2. Upload a UPI QR in Settings.
3. Add a tenant, generate a payment link, open it in an incognito tab, submit a test payment.
4. Verify it from the Payments panel and confirm the dashboard updates.

## Common issues

| Symptom | Cause |
|---|---|
| Login works but every subsequent request is 401 | `CLIENT_URL` on Render doesn't exactly match your Vercel URL (protocol + domain), so CORS is blocking the request or cookies aren't accepted cross-site |
| `prisma migrate` hangs or errors about prepared statements | You ran it against the Supabase **pooler** URL instead of the **direct** URL — pooler mode (PgBouncer transaction mode) doesn't support the session features migrations need |
| Images (QR/proof) 404 after a Render redeploy | Local disk storage was wiped on redeploy — see the `STORAGE_DRIVER` note above |
| `prisma generate` fails during Render build | Check Render's build logs for a blocked engine download; Render generally allows this, but if it doesn't, Prisma's Accelerate/Data Proxy is the serverless-friendly alternative |
