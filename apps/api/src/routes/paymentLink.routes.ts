import { Router } from "express";
import * as paymentLinkController from "@/controllers/paymentLink.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { createPaymentLinkSchema, paymentLinkIdParamSchema } from "@/validators/paymentLink.validator";

const router = Router();

router.use(authenticate);

router.get("/", paymentLinkController.list);
router.post("/", validate(createPaymentLinkSchema), paymentLinkController.create);
router.patch(
  "/:id/deactivate",
  validate(paymentLinkIdParamSchema, "params"),
  paymentLinkController.deactivate
);

export default router;
