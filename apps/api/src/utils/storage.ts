import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { UPLOAD_DIR } from "@/config/paths";
import { ApiError } from "@/utils/ApiError";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  const rawUrl = env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const rawKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!rawUrl || !rawKey) {
    throw ApiError.badRequest(
      "STORAGE_DRIVER is set to 'supabase' but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is missing on Render."
    );
  }

  if (!supabaseClient) {
    let url = rawUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    supabaseClient = createClient(url, rawKey, {
      auth: { persistSession: false },
    });
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
 *   URL. If Supabase is unconfigured or returns an error, throws a detailed ApiError.
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
    try {
      const client = getSupabaseClient();
      const bucket = (env.SUPABASE_STORAGE_BUCKET || "uploads").trim().replace(/^["']|["']$/g, "");
      const fileData = new Uint8Array(file.buffer);

      const { error } = await client.storage.from(bucket).upload(filename, fileData, {
        contentType: file.mimetype || "image/png",
        upsert: true,
        cacheControl: "3600",
      });

      if (error) {
        throw ApiError.badRequest(
          `Supabase Storage upload failed: ${error.message} (Bucket: '${bucket}'). Please verify the bucket exists and is marked Public in Supabase Dashboard.`
        );
      }

      const { data } = client.storage.from(bucket).getPublicUrl(filename);
      if (!data || !data.publicUrl) {
        throw ApiError.badRequest("Failed to generate public URL from Supabase Storage.");
      }

      return data.publicUrl;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw ApiError.badRequest(`Supabase Storage Error: ${msg}`);
    }
  }

  // Local disk storage (dev / fallback)
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}