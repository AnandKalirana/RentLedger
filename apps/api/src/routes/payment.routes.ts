import { Router } from "express";
import * as paymentController from "@/controllers/payment.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import {
  listPaymentsQuerySchema,
  paymentIdParamSchema,
  rejectPaymentSchema,
} from "@/validators/payment.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(listPaymentsQuerySchema, "query"), paymentController.list);
router.get("/:id", validate(paymentIdParamSchema, "params"), paymentController.getOne);
router.patch("/:id/verify", validate(paymentIdParamSchema, "params"), paymentController.verify);
router.patch(
  "/:id/reject",
  validate(paymentIdParamSchema, "params"),
  validate(rejectPaymentSchema),
  paymentController.reject
);

export default router;
