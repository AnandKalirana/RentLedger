import { Router } from "express";
import * as publicController from "@/controllers/public.controller";
import * as paymentController from "@/controllers/payment.controller";
import { validate } from "@/middleware/validate";
import { uploadPaymentProof } from "@/middleware/upload";
import { paymentSubmissionRateLimiter } from "@/middleware/rateLimiter";
import { paymentLinkTokenParamSchema } from "@/validators/paymentLink.validator";
import { submitPaymentSchema } from "@/validators/payment.validator";

const router = Router();

router.get(
  "/payment-links/:token",
  validate(paymentLinkTokenParamSchema, "params"),
  publicController.getLinkInfo
);

router.post(
  "/payment-links/:token/submit",
  paymentSubmissionRateLimiter,
  validate(paymentLinkTokenParamSchema, "params"),
  uploadPaymentProof,
  validate(submitPaymentSchema),
  paymentController.submit
);

export default router;
