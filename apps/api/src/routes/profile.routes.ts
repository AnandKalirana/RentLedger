import { Router } from "express";
import * as profileController from "@/controllers/profile.controller";
import { authenticate } from "@/middleware/authenticate";
import { validate } from "@/middleware/validate";
import { uploadQrImage } from "@/middleware/upload";
import { updateProfileSchema } from "@/validators/profile.validator";

const router = Router();

router.use(authenticate);

router.get("/", profileController.getProfile);
router.patch("/", validate(updateProfileSchema), profileController.updateProfile);
router.post("/qr-code", uploadQrImage, profileController.uploadQrCode);

export default router;
