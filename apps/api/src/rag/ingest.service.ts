/**
 * RAG Ingestion Service.
 *
 * Converts Tenants and Payments into vector-embedded document chunks.
 * Enforces per-landlord scoping and assigns visibility roles to chunks.
 * Upserts are idempotent based on (landlordId, sourceType, sourceId, chunkIndex).
 */

import { prisma } from "@/config/database";
import { getEmbeddingProvider } from "./providers";
import type { ChunkSourceType, ChunkVisibility } from "@rentledger/shared";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMonthName(monthNumber: number): string {
  return MONTH_NAMES[monthNumber - 1] ?? `Month ${monthNumber}`;
}

/**
 * Upsert chunk helper that writes the chunk record and the raw vector embedding.
 */
async function upsertChunk(data: {
  landlordId: string;
  tenantId?: string | null;
  sourceType: ChunkSourceType;
  sourceId: string;
  chunkIndex: number;
  content: string;
  visibility: ChunkVisibility;
  embedding: number[];
}): Promise<void> {
  // Upsert the DocumentChunk row via Prisma
  const chunk = await prisma.documentChunk.upsert({
    where: {
      landlordId_sourceType_sourceId_chunkIndex: {
        landlordId: data.landlordId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        chunkIndex: data.chunkIndex,
      },
    },
    create: {
      landlordId: data.landlordId,
      tenantId: data.tenantId ?? null,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      chunkIndex: data.chunkIndex,
      content: data.content,
      visibility: data.visibility,
    },
    update: {
      tenantId: data.tenantId ?? null,
      content: data.content,
      visibility: data.visibility,
    },
  });

  // Store vector embedding if supported by the database engine (pgvector)
  try {
    if (typeof (prisma as unknown as { $executeRawUnsafe?: unknown }).$executeRawUnsafe === "function") {
      const vectorStr = `[${data.embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "document_chunks" SET "embedding" = $1::vector WHERE "id" = $2`,
        vectorStr,
        chunk.id
      );
    }
  } catch (err: unknown) {
    // If not running in postgres / pgvector (e.g. unit test mock), ignore embedding column update error
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[Ingest] Vector embedding raw update warning: ${(err as Error)?.message}`);
    }
  }
}

/**
 * Ingest a Payment into vector chunks.
 */
export async function ingestPayment(paymentId: string, landlordId: string): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, landlordId },
    include: { tenant: true },
  });

  if (!payment) return;

  const embeddingProvider = getEmbeddingProvider();
  const monthStr = getMonthName(payment.billingMonth);

  // 1. Primary payment chunk (Visibility: MANAGER)
  const paymentContent = [
    `Payment Record ID: ${payment.id}`,
    `Tenant: ${payment.tenant.fullName} (Mobile: ${payment.tenant.mobileNumber})`,
    `Amount: ₹${payment.amount}`,
    `Billing Period: ${monthStr} ${payment.billingYear}`,
    `Status: ${payment.status}`,
    `Submitted Name: ${payment.submittedName}`,
    `Submitted Mobile: ${payment.submittedMobile}`,
    payment.verifiedAt ? `Verified At: ${payment.verifiedAt.toISOString()}` : null,
  ].filter(Boolean).join(". ") + ".";

  const paymentVec = await embeddingProvider.embedQuery(paymentContent);
  await upsertChunk({
    landlordId,
    tenantId: payment.tenantId,
    sourceType: "PAYMENT",
    sourceId: payment.id,
    chunkIndex: 0,
    content: paymentContent,
    visibility: "MANAGER",
    embedding: paymentVec,
  });

  // 2. Rejection reason chunk if REJECTED, otherwise clean up any previous rejection chunk
  if (payment.status === "REJECTED" && payment.rejectionReason) {
    const rejectionContent = [
      `Payment Rejection Record for Tenant: ${payment.tenant.fullName}`,
      `Payment ID: ${payment.id}`,
      `Amount: ₹${payment.amount} for ${monthStr} ${payment.billingYear}`,
      `Status: REJECTED`,
      `Rejection Reason: ${payment.rejectionReason}`,
    ].join(". ") + ".";

    const rejectionVec = await embeddingProvider.embedQuery(rejectionContent);
    await upsertChunk({
      landlordId,
      tenantId: payment.tenantId,
      sourceType: "REJECTION_REASON",
      sourceId: payment.id,
      chunkIndex: 0,
      content: rejectionContent,
      visibility: "MANAGER",
      embedding: rejectionVec,
    });
  } else {
    // Delete rejection chunk if payment is not rejected
    await prisma.documentChunk.deleteMany({
      where: {
        landlordId,
        sourceType: "REJECTION_REASON",
        sourceId: payment.id,
      },
    }).catch(() => {});
  }
}

/**
 * Ingest a Tenant profile into vector chunks.
 */
export async function ingestTenant(tenantId: string, landlordId: string): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, landlordId },
  });

  if (!tenant) return;

  const embeddingProvider = getEmbeddingProvider();
  const moveInDateStr = tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split("T")[0] : "N/A";

  const tenantContent = [
    `Tenant Profile: ${tenant.fullName}`,
    `Mobile: ${tenant.mobileNumber}`,
    tenant.email ? `Email: ${tenant.email}` : null,
    `Monthly Rent: ₹${tenant.monthlyRent}`,
    tenant.monthlyMaintenance ? `Monthly Maintenance: ₹${tenant.monthlyMaintenance}` : null,
    `Security Deposit: ₹${tenant.securityDeposit}`,
    `Rent Due Day: ${tenant.rentDueDay} of every month`,
    `Move-in Date: ${moveInDateStr}`,
    `Status: ${tenant.status}`,
    tenant.notes ? `Landlord Notes: ${tenant.notes}` : null,
  ].filter(Boolean).join(". ") + ".";

  const tenantVec = await embeddingProvider.embedQuery(tenantContent);
  await upsertChunk({
    landlordId,
    tenantId: tenant.id,
    sourceType: "TENANT_NOTE",
    sourceId: tenant.id,
    chunkIndex: 0,
    content: tenantContent,
    visibility: "TENANT_VIEWER",
    embedding: tenantVec,
  });
}

/**
 * Delete all chunks associated with a payment.
 */
export async function deletePaymentChunks(paymentId: string, landlordId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({
    where: {
      landlordId,
      sourceId: paymentId,
      sourceType: { in: ["PAYMENT", "REJECTION_REASON"] },
    },
  });
}

/**
 * Delete all chunks associated with a tenant.
 */
export async function deleteTenantChunks(tenantId: string, landlordId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({
    where: {
      landlordId,
      OR: [
        { tenantId },
        { sourceId: tenantId, sourceType: "TENANT_NOTE" },
      ],
    },
  });
}

/**
 * Backfill all tenants and payments for a specific landlord.
 */
export async function backfillLandlord(landlordId: string): Promise<{ tenantsIngested: number; paymentsIngested: number }> {
  const tenants = await prisma.tenant.findMany({
    where: { landlordId },
    select: { id: true },
  });

  for (const t of tenants) {
    await ingestTenant(t.id, landlordId);
  }

  const payments = await prisma.payment.findMany({
    where: { landlordId },
    select: { id: true },
  });

  for (const p of payments) {
    await ingestPayment(p.id, landlordId);
  }

  return {
    tenantsIngested: tenants.length,
    paymentsIngested: payments.length,
  };
}

/**
 * Backfill all landlords across the entire system.
 */
export async function backfillAll(): Promise<{ landlordsProcessed: number; tenantsIngested: number; paymentsIngested: number }> {
  const landlords = await prisma.landlord.findMany({
    select: { id: true },
  });

  let totalTenants = 0;
  let totalPayments = 0;

  for (const landlord of landlords) {
    const res = await backfillLandlord(landlord.id);
    totalTenants += res.tenantsIngested;
    totalPayments += res.paymentsIngested;
  }

  return {
    landlordsProcessed: landlords.length,
    tenantsIngested: totalTenants,
    paymentsIngested: totalPayments,
  };
}
