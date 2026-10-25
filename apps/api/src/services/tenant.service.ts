import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";
import { CreateTenantInput, UpdateTenantInput } from "@/validators/tenant.validator";
import { ingestTenant, deleteTenantChunks } from "@/rag/ingest.service";

// Every function here takes landlordId explicitly and uses it in the `where`
// clause — never trust a tenant id alone. This is what makes the app safe for
// multiple landlords to share the same database without seeing each other's data.

export async function listTenants(landlordId: string) {
  return prisma.tenant.findMany({
    where: { landlordId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantById(landlordId: string, tenantId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, landlordId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!tenant) throw ApiError.notFound("Tenant not found");
  return tenant;
}

export async function createTenant(landlordId: string, input: CreateTenantInput) {
  const tenant = await prisma.tenant.create({
    data: { ...input, landlordId },
  });
  ingestTenant(tenant.id, landlordId).catch((err) =>
    console.error("[RAG] Failed to ingest tenant:", err)
  );
  return tenant;
}

export async function updateTenant(landlordId: string, tenantId: string, input: UpdateTenantInput) {
  // findFirst (not update directly) so we return a proper 404 instead of a
  // Prisma "record not found" error when the tenant belongs to another landlord.
  await getTenantById(landlordId, tenantId);
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: input,
  });
  ingestTenant(tenantId, landlordId).catch((err) =>
    console.error("[RAG] Failed to re-ingest tenant:", err)
  );
  return updated;
}

export async function deleteTenant(landlordId: string, tenantId: string) {
  await getTenantById(landlordId, tenantId);
  await prisma.tenant.delete({ where: { id: tenantId } });
  deleteTenantChunks(tenantId, landlordId).catch((err) =>
    console.error("[RAG] Failed to delete tenant chunks:", err)
  );
}

export async function uploadLeaseDocument(landlordId: string, tenantId: string, url: string) {
  await getTenantById(landlordId, tenantId);
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { leaseDocumentUrl: url },
  });
  ingestTenant(tenantId, landlordId).catch((err) =>
    console.error("[RAG] Failed to re-ingest tenant:", err)
  );
  return updated;
}

