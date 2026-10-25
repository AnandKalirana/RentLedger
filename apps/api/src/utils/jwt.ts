import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import type { UserRole } from "@rentledger/shared";

export interface AccessTokenPayload {
  landlordId: string;
  email: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
}
