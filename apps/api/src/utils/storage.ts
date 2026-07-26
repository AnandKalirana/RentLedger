import path from "path";
import { env } from "@/config/env";

/**
 * Given a multer-saved filename, returns the URL the frontend can load the file from.
 * Local mode serves files from the static /uploads route registered in app.ts.
 * When STORAGE_DRIVER=s3, multer should instead be configured with multer-s3
 * (see middleware/upload.ts) and this function should return the S3 object URL
 * that the upload handler already receives on `file.location`.
 */
export function resolveProofUrl(filename: string): string {
  if (env.STORAGE_DRIVER === "s3") {
    // multer-s3 attaches the final URL to req.file.location; controllers should
    // pass that value straight through rather than calling this resolver.
    throw new Error("resolveProofUrl() called in s3 mode — use req.file.location instead");
  }
  return `/uploads/${path.basename(filename)}`;
}
