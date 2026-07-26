import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/response";
import { ApiError } from "@/utils/ApiError";
import * as paymentService from "@/services/payment.service";

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Payment proof image is required");
  const payment = await paymentService.submitPublicPayment(req.params.token, req.body, req.file);
  return sendCreated(res, {
    id: payment.id,
    status: payment.status,
    message: "Payment submitted. The landlord will verify it shortly.",
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.listPayments(req.landlord!.id, req.query as never);
  return sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentById(req.landlord!.id, req.params.id);
  return sendSuccess(res, payment);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.verifyPayment(req.landlord!.id, req.params.id);
  return sendSuccess(res, payment);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.rejectPayment(req.landlord!.id, req.params.id, req.body.reason);
  return sendSuccess(res, payment);
});
