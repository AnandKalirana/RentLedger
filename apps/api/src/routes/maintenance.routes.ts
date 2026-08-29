import { Router } from "express";
import * as maintenanceController from "@/controllers/maintenance.controller";
import { authenticate } from "@/middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", maintenanceController.list);
router.post("/", maintenanceController.create);
router.patch("/:id/status", maintenanceController.updateStatus);
router.delete("/:id", maintenanceController.remove);

export default router;
