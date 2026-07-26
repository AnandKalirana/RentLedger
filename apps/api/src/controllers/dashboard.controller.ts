import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import * as dashboardService from "@/services/dashboard.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getDashboardSummary(req.landlord!.id);
  return sendSuccess(res, data);
});
