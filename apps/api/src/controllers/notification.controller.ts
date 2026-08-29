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

export const triggerReminders = asyncHandler(async (req: Request, res: Response) => {
  const { sendWhatsAppReminder, processDueReminders } = await import("@/services/reminder.service");
  if (req.body.mobileNumber && req.body.tenantName && req.body.amount) {
    await sendWhatsAppReminder(
      req.body.mobileNumber,
      req.body.tenantName,
      Number(req.body.amount),
      req.body.rentDueDay ?? 1
    );
    return sendSuccess(res, { message: `WhatsApp reminder sent to ${req.body.tenantName}` });
  }
  const result = await processDueReminders();
  return sendSuccess(res, result);
});

