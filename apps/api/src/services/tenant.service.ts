import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";
import { CreateTenantInput, UpdateTenantInput } from "@/validators/tenant.validator";

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
  return prisma.tenant.create({
    data: { ...input, landlordId },
  });
}

export async function updateTenant(landlordId: string, tenantId: string, input: UpdateTenantInput) {
  // findFirst (not update directly) so we return a proper 404 instead of a
  // Prisma "record not found" error when the tenant belongs to another landlord.
  await getTenantById(landlordId, tenantId);
  return prisma.tenant.update({
    where: { id: tenantId },
    data: input,
  });
}

export async function deleteTenant(landlordId: string, tenantId: string) {
  await getTenantById(landlordId, tenantId);
  await prisma.tenant.delete({ where: { id: tenantId } });
}
