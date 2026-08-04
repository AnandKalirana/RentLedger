import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { env } from "@/config/env";
import { UPLOAD_DIR } from "@/config/paths";
import { ApiError } from "@/utils/ApiError";

// Trims accidental quotes/whitespace pasted into Render's env var panel.
function clean(value: string | undefined): string | undefined {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

const supabaseUrl = clean(env.SUPABASE_URL);
const supabaseKey = clean(env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseBucket = clean(env.SUPABASE_STORAGE_BUCKET) ?? "uploads";

function buildFilename(prefix: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const unique = crypto.randomBytes(16).toString("hex");
  return `${prefix}-${Date.now()}-${unique}${ext}`;
}

/**
 * Uploads directly against the Supabase Storage REST API instead of using
 * @supabase/supabase-js. The full SDK also bundles Realtime/Auth/Postgrest
 * clients, and recent versions eagerly check for a native `WebSocket` global
 * (only built into Node 22+) the moment createClient() runs — even though we
 * only ever touch Storage. Calling the REST API directly with `fetch` (native
 * since Node 18) avoids that check entirely and drops four unused deps.
 */
async function uploadToSupabase(filename: string, file: Express.Multer.File): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    throw ApiError.internal(
      "Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filename}`;

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        "Content-Type": file.mimetype,
        "x-upsert": "false",
      },
      body: new Uint8Array(file.buffer),
    });
  } catch (networkErr) {
    throw ApiError.internal(
      `Could not reach Supabase Storage: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw ApiError.badRequest(`Supabase Storage upload failed (${response.status}): ${detail}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${filename}`;
}

export async function persistUploadedFile(
  file: Express.Multer.File,
  prefix: "proof" | "qr"
): Promise<string> {
  const filename = buildFilename(prefix, file.originalname);

  if (env.STORAGE_DRIVER === "supabase") {
    return uploadToSupabase(filename, file);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}