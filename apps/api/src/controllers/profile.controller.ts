import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import { ApiError } from "@/utils/ApiError";
import { resolveProofUrl } from "@/utils/storage";
import * as profileService from "@/services/profile.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.getProfile(req.landlord!.id);
  return sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.updateProfile(req.landlord!.id, req.body);
  return sendSuccess(res, profile);
});

export const uploadQrCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("QR code image is required");
  const profile = await profileService.updateQrImage(req.landlord!.id, resolveProofUrl(req.file.filename));
  return sendSuccess(res, profile);
});
