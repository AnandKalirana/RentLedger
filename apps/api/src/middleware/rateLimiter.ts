import rateLimit from "express-rate-limit";
import { RATE_LIMITS } from "@rentledger/shared";

function buildLimiter(config: { windowMs: number; max: number }, message: string) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });
}

export const loginRateLimiter = buildLimiter(
  RATE_LIMITS.LOGIN,
  "Too many login attempts. Please try again later."
);

export const registerRateLimiter = buildLimiter(
  RATE_LIMITS.REGISTER,
  "Too many accounts created from this location. Please try again later."
);

export const paymentSubmissionRateLimiter = buildLimiter(
  RATE_LIMITS.PAYMENT_SUBMISSION,
  "Too many payment submissions. Please try again in a while."
);

export const defaultRateLimiter = buildLimiter(
  RATE_LIMITS.DEFAULT,
  "Too many requests. Please slow down."
);
