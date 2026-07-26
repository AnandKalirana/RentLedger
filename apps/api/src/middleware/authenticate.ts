import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken } from "@/utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      landlord?: { id: string; email: string };
    }
  }
}

/**
 * Requires a valid access token, sent either as a Bearer header (mobile/API clients)
 * or as an httpOnly cookie (browser clients). Populates req.landlord on success.
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
    req.landlord = { id: payload.landlordId, email: payload.email };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired session"));
  }
}
