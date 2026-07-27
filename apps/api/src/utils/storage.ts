import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { UPLOAD_DIR } from "@/config/paths";
import { ApiError } from "@/utils/ApiError";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw ApiError.internal(
      "Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function buildFilename(prefix: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const unique = crypto.randomBytes(16).toString("hex");
  return `${prefix}-${Date.now()}-${unique}${ext}`;
}

/**
 * Persists an uploaded file (held in memory by multer) and returns the URL the
 * frontend should use to load it.
 *
 * - local mode: writes to disk, returns a relative /uploads path served by
 *   express.static (see app.ts). Fine for dev, but most PaaS free tiers wipe
 *   this on every redeploy.
 * - supabase mode: uploads to a Supabase Storage bucket and returns its public
 *   URL, which survives redeploys/restarts — this is what production uses.
 */
export async function persistUploadedFile(
  file: Express.Multer.File,
  prefix: "proof" | "qr"
): Promise<string> {
  const filename = buildFilename(prefix, file.originalname);

  if (env.STORAGE_DRIVER === "supabase") {
    const client = getSupabaseClient();
    const bucket = env.SUPABASE_STORAGE_BUCKET;
    const { error } = await client.storage.from(bucket).upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) {
      throw ApiError.internal(`Failed to upload file to storage: ${error.message}`);
    }
    const { data } = client.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}