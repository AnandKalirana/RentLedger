import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { UPLOAD_DIR } from "@/config/paths";
import { ApiError } from "@/utils/ApiError";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!supabaseClient) {
    let url = env.SUPABASE_URL.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    supabaseClient = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function buildFilename(prefix: string, originalName: string): string {
  const ext = path.extname(originalName || "file.png").toLowerCase() || ".png";
  const unique = crypto.randomBytes(16).toString("hex");
  return `${prefix}-${Date.now()}-${unique}${ext}`;
}

/**
 * Persists an uploaded file (held in memory by multer) and returns the URL the
 * frontend should use to load it.
 *
 * - supabase mode: uploads to a Supabase Storage bucket and returns its public
 *   URL. If Supabase is unconfigured or fails, falls back gracefully to local disk.
 * - local mode: writes to disk and returns relative /uploads path.
 */
export async function persistUploadedFile(
  file: Express.Multer.File,
  prefix: "proof" | "qr"
): Promise<string> {
  if (!file || !file.buffer) {
    throw ApiError.badRequest("No file content received for upload");
  }

  const filename = buildFilename(prefix, file.originalname);

  if (env.STORAGE_DRIVER === "supabase") {
    const client = getSupabaseClient();
    if (client) {
      const bucket = env.SUPABASE_STORAGE_BUCKET || "uploads";
      try {
        const { error } = await client.storage.from(bucket).upload(filename, file.buffer, {
          contentType: file.mimetype || "image/png",
          upsert: true,
        });

        if (!error) {
          const { data } = client.storage.from(bucket).getPublicUrl(filename);
          if (data?.publicUrl) {
            return data.publicUrl;
          }
        } else {
          console.error(`Supabase upload error for bucket '${bucket}':`, error.message);
        }
      } catch (err) {
        console.error("Supabase storage connection error:", err);
      }
    } else {
      console.warn(
        "STORAGE_DRIVER is set to 'supabase' but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to local storage."
      );
    }
  }

  // Fallback to local disk storage
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}