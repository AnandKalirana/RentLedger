import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";

export interface CreateMaintenanceInput {
  tenantId: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  notes?: string;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
}

export async function listMaintenanceRecords(
  landlordId: string,
  query: { tenantId?: string; billingMonth?: number; billingYear?: number; status?: string }
) {
  const where: any = { landlordId };
  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.billingMonth) where.billingMonth = Number(query.billingMonth);
  if (query.billingYear) where.billingYear = Number(query.billingYear);
  if (query.status) where.status = query.status;

  const records = await prisma.maintenanceRecord.findMany({
    where,
    include: {
      tenant: { select: { id: true, fullName: true, mobileNumber: true, monthlyMaintenance: true } },
    },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }, { createdAt: "desc" }],
  });

  return records;
}

export async function createMaintenanceRecord(landlordId: string, input: CreateMaintenanceInput) {
  // Ensure tenant belongs to landlord
  const tenant = await prisma.tenant.findFirst({
    where: { id: input.tenantId, landlordId },
  });

  if (!tenant) throw ApiError.notFound("Tenant not found");

  const record = await prisma.maintenanceRecord.create({
    data: {
      landlordId,
      tenantId: input.tenantId,
      amount: input.amount,
      billingMonth: input.billingMonth,
      billingYear: input.billingYear,
      status: input.status ?? "PENDING",
      notes: input.notes,
      paidAt: input.status === "VERIFIED" ? new Date() : null,
    },
    include: {
      tenant: { select: { id: true, fullName: true, mobileNumber: true } },
    },
  });

  return record;
}

export async function updateMaintenanceStatus(
  landlordId: string,
  recordId: string,
  status: "VERIFIED" | "REJECTED" | "PENDING",
  notes?: string
) {
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, landlordId },
  });

  if (!record) throw ApiError.notFound("Maintenance record not found");

  const updated = await prisma.maintenanceRecord.update({
    where: { id: recordId },
    data: {
      status,
      notes: notes ?? record.notes,
      paidAt: status === "VERIFIED" ? new Date() : record.paidAt,
    },
  });

  return updated;
}

export async function deleteMaintenanceRecord(landlordId: string, recordId: string) {
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, landlordId },
  });

  if (!record) throw ApiError.notFound("Maintenance record not found");

  await prisma.maintenanceRecord.delete({ where: { id: recordId } });
}
