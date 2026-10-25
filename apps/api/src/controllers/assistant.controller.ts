import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendSuccess } from "@/utils/response";
import { chatWithAssistant } from "@/rag/chat.service";
import type { ChatRequestInput } from "@/validators/assistant.validator";

/**
 * POST /api/assistant/chat
 *
 * Landlord ID and role are extracted directly from req.landlord (set by JWT authenticate middleware).
 * They are never accepted from the request body or query params.
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body as ChatRequestInput;
  const landlordId = req.landlord!.id;
  const role = req.landlord!.role;

  const result = await chatWithAssistant({
    landlordId,
    role,
    message,
    history,
  });

  return sendSuccess(res, result);
});
