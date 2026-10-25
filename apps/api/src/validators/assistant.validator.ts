import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
