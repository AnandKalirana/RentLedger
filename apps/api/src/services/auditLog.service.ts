import { prisma } from "@/config/database";
import type { ListAuditLogsQuery } from "@/validators/auditLog.validator";
import { Prisma } from "@rentledger/database";

/**
 * List audit logs for a landlord (paginated).
 *
 * Only the requesting landlord's own logs are ever returned — landlordId comes
 * from the verified JWT, never from request input.
 */
export async function listAuditLogs(landlordId: string, query: ListAuditLogsQuery) {
  const where: Prisma.AuditLogWhereInput = {
    landlordId,
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(query.action ? { action: query.action } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}
