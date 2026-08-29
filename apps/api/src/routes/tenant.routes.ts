import { Router } from "express";
import * as tenantController from "@/controllers/tenant.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { createTenantSchema, tenantIdParamSchema, updateTenantSchema } from "@/validators/tenant.validator";

import { uploadLeaseDocument } from "@/middleware/upload";

const router = Router();

router.use(authenticate);

router.get("/", tenantController.list);
router.post("/", validate(createTenantSchema), tenantController.create);
router.get("/:id", validate(tenantIdParamSchema, "params"), tenantController.getOne);
router.patch(
  "/:id",
  validate(tenantIdParamSchema, "params"),
  validate(updateTenantSchema),
  tenantController.update
);
router.delete("/:id", validate(tenantIdParamSchema, "params"), tenantController.remove);
router.post("/:id/lease", validate(tenantIdParamSchema, "params"), uploadLeaseDocument, tenantController.uploadLease);

export default router;
