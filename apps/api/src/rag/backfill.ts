/**
 * RAG Backfill Script.
 *
 * Scans all existing landlords, tenants, and payments, generates vector embeddings,
 * and upserts document chunks into PostgreSQL pgvector.
 *
 * Usage:
 *   npx ts-node src/rag/backfill.ts
 */

import { connectDatabase, disconnectDatabase } from "@/config/database";
import { backfillAll } from "./ingest.service";

async function run() {
  console.log("Starting RAG document chunk backfill...");
  await connectDatabase();

  const start = Date.now();
  const summary = await backfillAll();
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log("------------------------------------------");
  console.log("RAG Backfill complete!");
  console.log(`Landlords processed: ${summary.landlordsProcessed}`);
  console.log(`Tenants ingested:    ${summary.tenantsIngested}`);
  console.log(`Payments ingested:   ${summary.paymentsIngested}`);
  console.log(`Total time elapsed:  ${elapsed}s`);
  console.log("------------------------------------------");

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error("Backfill failed:", err);
  await disconnectDatabase();
  process.exit(1);
});
