import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@rentledger/shared";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  phone: z.string().trim().min(7).max(15).optional(),
  businessName: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
