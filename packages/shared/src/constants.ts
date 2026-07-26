export const ALLOWED_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const PASSWORD_MIN_LENGTH = 8;

export const RENT_DUE_DAY_MIN = 1;
export const RENT_DUE_DAY_MAX = 31;

export const PAYMENT_LINK_TOKEN_LENGTH = 25; // matches cuid() length

export const RATE_LIMITS = {
  // Public payment submission endpoint — most abuse-prone surface in the app
  PAYMENT_SUBMISSION: { windowMs: 15 * 60 * 1000, max: 10 },
  // Auth endpoints — brute force protection
  LOGIN: { windowMs: 15 * 60 * 1000, max: 10 },
  REGISTER: { windowMs: 60 * 60 * 1000, max: 5 },
  // General authenticated API traffic
  DEFAULT: { windowMs: 15 * 60 * 1000, max: 300 },
} as const;
