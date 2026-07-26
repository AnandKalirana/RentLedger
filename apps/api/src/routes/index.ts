import { Router } from "express";
import authRoutes from "@/routes/auth.routes";
import tenantRoutes from "@/routes/tenant.routes";
import paymentRoutes from "@/routes/payment.routes";
import paymentLinkRoutes from "@/routes/paymentLink.routes";
import dashboardRoutes from "@/routes/dashboard.routes";
import exportRoutes from "@/routes/export.routes";
import publicRoutes from "@/routes/public.routes";
import notificationRoutes from "@/routes/notification.routes";
import profileRoutes from "@/routes/profile.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/payments", paymentRoutes);
router.use("/payment-links", paymentLinkRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/exports", exportRoutes);
router.use("/public", publicRoutes);
router.use("/notifications", notificationRoutes);
router.use("/profile", profileRoutes);

export default router;
