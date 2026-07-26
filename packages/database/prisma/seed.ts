/**
 * Seed script.
 *
 * Intentionally does NOT create fake tenants, payments, or revenue numbers —
 * the dashboard must only ever reflect real data. This script only creates
 * a dev-only landlord account (guarded behind NODE_ENV) so you have something
 * to log in with on a fresh database.
 */
import bcrypt from "bcrypt";
import { prisma } from "../src/client";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping seed: refusing to run in production.");
    return;
  }

  const devEmail = process.env.SEED_LANDLORD_EMAIL ?? "demo@rentledger.local";
  const devPassword = process.env.SEED_LANDLORD_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.landlord.findUnique({ where: { email: devEmail } });
  if (existing) {
    console.log(`Seed landlord already exists: ${devEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(devPassword, 12);

  const landlord = await prisma.landlord.create({
    data: {
      email: devEmail,
      passwordHash,
      fullName: "Demo Landlord",
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Created dev landlord: ${landlord.email} (password: ${devPassword})`);
  console.log("No tenants or payments were seeded. Add real data through the app.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
