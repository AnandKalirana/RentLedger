import { Router } from "express";
import * as notificationController from "@/controllers/notification.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.list);
router.patch(
  "/:id/read",
  validate(z.object({ id: z.string().cuid() }), "params"),
  notificationController.markRead
);

export default router;
