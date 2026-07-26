import { z } from "zod";

export const createPaymentLinkSchema = z
  .object({
    type: z.enum(["REUSABLE", "TENANT_SPECIFIC"]),
    tenantId: z.string().cuid().optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine((data) => data.type === "REUSABLE" || !!data.tenantId, {
    message: "tenantId is required for a TENANT_SPECIFIC link",
    path: ["tenantId"],
  });

export const paymentLinkIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const paymentLinkTokenParamSchema = z.object({
  token: z.string().min(1),
});

export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;
