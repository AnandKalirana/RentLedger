import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireRole } from "@/middleware/requireRole";
import { validate } from "@/middleware/validate";
import { list } from "@/controllers/auditLog.controller";
import { listAuditLogsQuerySchema } from "@/validators/auditLog.validator";

const router = Router();

// Only LANDLORD role can query their own audit trail
router.get(
  "/",
  authenticate,
  requireRole("LANDLORD"),
  validate(listAuditLogsQuerySchema, "query"),
  list
);

export default router;
