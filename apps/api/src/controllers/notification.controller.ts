import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import * as notificationService from "@/services/notification.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === "true";
  const notifications = await notificationService.listNotifications(req.landlord!.id, unreadOnly);
  return sendSuccess(res, notifications);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markNotificationRead(req.landlord!.id, req.params.id);
  return sendSuccess(res, { message: "Marked as read" });
});
