import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  // Optional date range filters
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  action: z.string().max(64).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
