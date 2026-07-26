import { z } from "zod";
import { RENT_DUE_DAY_MAX, RENT_DUE_DAY_MIN } from "@rentledger/shared";

export const createTenantSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  mobileNumber: z.string().trim().min(7).max(15),
  email: z.string().trim().toLowerCase().email().optional(),
  monthlyRent: z.coerce.number().positive(),
  securityDeposit: z.coerce.number().min(0).default(0),
  moveInDate: z.coerce.date(),
  rentDueDay: z.coerce.number().int().min(RENT_DUE_DAY_MIN).max(RENT_DUE_DAY_MAX).default(1),
  notes: z.string().trim().max(1000).optional(),
});

export const updateTenantSchema = createTenantSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const tenantIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
