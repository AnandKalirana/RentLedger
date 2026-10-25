import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken } from "@/utils/jwt";
import type { UserRole } from "@rentledger/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      landlord?: { id: string; email: string; role: UserRole };
    }
  }
}

/**
 * Requires a valid access token, sent either as a Bearer header (mobile/API clients)
 * or as an httpOnly cookie (browser clients). Populates req.landlord on success.
 *
 * The `role` field comes only from the verified JWT — it is never read from the
 * request body or query string.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer ?? req.cookies?.accessToken;

  if (!token) {
    return next(ApiError.unauthorized("Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.landlord = { id: payload.landlordId, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired session"));
  }
}
