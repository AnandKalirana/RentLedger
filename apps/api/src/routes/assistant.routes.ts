import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { chatRequestSchema } from "@/validators/assistant.validator";
import { chat } from "@/controllers/assistant.controller";

const router = Router();

// All assistant routes require authentication
router.use(authenticate);

// Chat endpoint (accessible by all authenticated roles, results filtered by role in retrieval layer)
router.post("/chat", validate(chatRequestSchema), chat);

export default router;
