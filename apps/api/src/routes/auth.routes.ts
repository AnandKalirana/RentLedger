import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/authenticate";
import { loginRateLimiter, registerRateLimiter } from "@/middleware/rateLimiter";
import { loginSchema, registerSchema } from "@/validators/auth.validator";

const router = Router();

router.post("/register", registerRateLimiter, validate(registerSchema), authController.register);
router.post("/login", loginRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
