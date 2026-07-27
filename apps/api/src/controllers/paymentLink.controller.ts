import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/response";
import { env } from "@/config/env";
import * as paymentLinkService from "@/services/paymentLink.service";

function buildPublicUrl(token: string) {
  return `${env.CLIENT_URL}/pay/${token}`;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const link = await paymentLinkService.createPaymentLink(req.landlord!.id, req.body);
  return sendCreated(res, { ...link, url: buildPublicUrl(link.token) });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const links = await paymentLinkService.listPaymentLinks(req.landlord!.id);
  return sendSuccess(res, links.map((link: (typeof links)[0]) => ({ ...link, url: buildPublicUrl(link.token) })));
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const link = await paymentLinkService.deactivatePaymentLink(req.landlord!.id, req.params.id);
  return sendSuccess(res, link);
});
