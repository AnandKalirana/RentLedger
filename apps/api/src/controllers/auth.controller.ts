import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/response";
import { ApiError } from "@/utils/ApiError";
import * as authService from "@/services/auth.service";
import { isProduction } from "@/config/env";

const REFRESH_COOKIE_NAME = "refreshToken";
const ACCESS_COOKIE_NAME = "accessToken";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, landlord } = await authService.registerLandlord(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  return sendCreated(res, { landlord, accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, landlord } = await authService.loginLandlord(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  return sendSuccess(res, { landlord, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  const { accessToken, refreshToken, landlord } = await authService.refreshSession(token);
  setAuthCookies(res, accessToken, refreshToken);
  return sendSuccess(res, { landlord, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) await authService.logout(token);

  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
  return sendSuccess(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // req.landlord is populated by the `authenticate` middleware
  return sendSuccess(res, { landlord: req.landlord });
});
