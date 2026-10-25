import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import { listAuditLogs } from "@/services/auditLog.service";

/**
 * GET /api/audit-logs
 * Lists the authenticated landlord's audit log entries (paginated).
 * LANDLORD role only — requireRole("LANDLORD") is applied at the route level.
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAuditLogs(req.landlord!.id, req.query as never);
  return sendSuccess(res, result);
});
