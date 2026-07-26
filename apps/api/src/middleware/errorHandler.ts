import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ApiError } from "@/utils/ApiError";
import { isProduction } from "@/config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5MB)." : "File upload failed.";
    return res.status(400).json({ success: false, message });
  }

  // Unexpected/programmer error — log full detail server-side, never leak internals to the client
  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: isProduction ? "Something went wrong. Please try again." : String(err),
  });
}
