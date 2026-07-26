# Deployment guide

This deploys three pieces, all on free tiers:

| Piece | Recommended host | Why |
|---|---|---|
| PostgreSQL | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Free tier, serverless Postgres, works well with Prisma |
| API (Express) | [Render](https://render.com) or [Railway](https://railway.app) | Free/cheap tier, easy env var management, persistent-enough for a demo |
| Web (Next.js) | [Vercel](https://vercel.com) | Built for Next.js, zero-config |

## 1. Database — Neon (or Supabase)

1. Create a free project at neon.tech.
2. Copy the connection string it gives you (it looks like
   `postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/rentledger?sslmode=require`).
3. Keep this — you'll paste it into the API's `DATABASE_URL` env var in step 2.

## 2. API — Render

1. Push this repo to GitHub first (see Git commands below) if you haven't.
2. On Render: **New → Web Service**, connect your GitHub repo.
3. **Root directory:** `apps/api`
4. **Build command:**
   ```
   npm install && npm run db:generate --workspace=packages/database && npm run build
   ```
   (Render builds from the repo root even with a root directory set for workspaces — if it
   only runs inside `apps/api`, use instead:
   `cd ../.. && npm install && npm run db:generate --workspace=packages/database && npm run build:api`)
5. **Start command:** `npm start` (or `node dist/server.js` from `apps/api`)
6. **Environment variables** — copy every key from `apps/api/.env.example` and set real values:
   - `DATABASE_URL` → the Neon connection string from step 1
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` → generate with
     `openssl rand -hex 32` (three different values)
   - `CLIENT_URL` → your Vercel URL once you have it (step 3) — e.g.
     `https://rentledger.vercel.app` (no trailing slash)
   - `NODE_ENV=production`
   - `STORAGE_DRIVER=local` works for a demo, **but Render's free tier wipes local disk on every
     redeploy** — uploaded proof/QR images will disappear. For anything beyond a quick demo,
     switch to S3 (or Cloudinary/Supabase Storage) and update `middleware/upload.ts` to use that
     SDK instead of `multer.diskStorage`.
   - SMTP vars if you want email notifications live (Gmail app password, SendGrid, etc.)
7. After first deploy, run migrations once against the production database:
   ```bash
   DATABASE_URL="<your-neon-url>" npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```
   (Run this from your local machine — it just needs network access to the DB.)
8. Render gives you a URL like `https://rentledger-api.onrender.com`. Confirm
   `https://rentledger-api.onrender.com/health` returns `{"status":"ok"}`.

## 3. Web — Vercel

1. On Vercel: **Add New → Project**, import the same GitHub repo.
2. **Root directory:** `apps/web`
3. **Framework preset:** Next.js (auto-detected)
4. **Environment variable:**
   - `NEXT_PUBLIC_API_URL` → `https://rentledger-api.onrender.com/api` (your Render URL + `/api`)
5. Deploy. Vercel gives you a URL like `https://rentledger.vercel.app`.
6. **Go back to Render** and update `CLIENT_URL` to this exact Vercel URL, then redeploy the API
   (CORS is locked to `CLIENT_URL`, so this step is required or every request will be blocked).

## 4. Verify end-to-end

1. Visit your Vercel URL, register a landlord account.
2. Upload a UPI QR in Settings.
3. Add a tenant, generate a payment link, open it in an incognito tab, submit a test payment.
4. Verify it from the Payments panel and confirm the dashboard updates.

## Common issues

| Symptom | Cause |
|---|---|
| Login works but every subsequent request is 401 | `CLIENT_URL` on the API doesn't exactly match your frontend's URL (protocol + domain), so cookies aren't being accepted cross-site, or CORS is blocking the request |
| Images (QR/proof) 404 after a redeploy | Local disk storage was wiped — see the `STORAGE_DRIVER` note above; move to S3 for anything persistent |
| `prisma generate` fails during build | Some free-tier build environments block Prisma's engine download the same way this sandbox did — check your host's docs for an allowed binary target, or use Prisma's `dataProxy`/Accelerate for serverless-friendly deploys |
