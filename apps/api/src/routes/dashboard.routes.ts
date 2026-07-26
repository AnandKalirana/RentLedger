import { Router } from "express";
import * as dashboardController from "@/controllers/dashboard.controller";
import { authenticate } from "@/middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/summary", dashboardController.summary);

export default router;
