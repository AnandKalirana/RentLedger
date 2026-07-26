import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as exportService from "@/services/export.service";

export const tenantPaymentHistoryPdf = asyncHandler(async (req: Request, res: Response) => {
  await exportService.streamTenantPaymentHistoryPdf(req.landlord!.id, req.params.id, res);
});
