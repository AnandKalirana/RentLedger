import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import * as paymentLinkService from "@/services/paymentLink.service";

export const getLinkInfo = asyncHandler(async (req: Request, res: Response) => {
  const info = await paymentLinkService.getPublicPaymentLink(req.params.token);
  return sendSuccess(res, info);
});
