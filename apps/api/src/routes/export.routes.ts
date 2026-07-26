import { Router } from "express";
import * as exportController from "@/controllers/export.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { tenantIdParamSchema } from "@/validators/tenant.validator";

const router = Router();

router.use(authenticate);

router.get(
  "/tenants/:id/pdf",
  validate(tenantIdParamSchema, "params"),
  exportController.tenantPaymentHistoryPdf
);

export default router;
