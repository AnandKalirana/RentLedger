import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  businessName: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(15).optional().or(z.literal("")),
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.+-]{2,256}@[A-Za-z]{2,64}$/, "Enter a valid UPI ID, e.g. name@bank")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
