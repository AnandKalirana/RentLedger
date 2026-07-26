import { z } from "zod";

export const submitPaymentSchema = z.object({
  submittedName: z.string().trim().min(2).max(100),
  submittedMobile: z.string().trim().min(7).max(15),
  submittedEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  billingMonth: z.coerce.number().int().min(1).max(12),
  billingYear: z.coerce.number().int().min(2000).max(2100),
});

export const verifyPaymentSchema = z.object({});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const paymentIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const listPaymentsQuerySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
