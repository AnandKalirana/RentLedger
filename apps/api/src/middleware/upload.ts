import multer from "multer";
import { ALLOWED_PROOF_MIME_TYPES, MAX_PROOF_FILE_SIZE_BYTES } from "@rentledger/shared";
import { ApiError } from "@/utils/ApiError";

// Files are held in memory only long enough to be handed to storage.ts, which
// persists them either to local disk (dev) or Supabase Storage (production).
// Using memoryStorage here (instead of the old diskStorage) means multer
// itself never needs to know or care which backend is active.
function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!ALLOWED_PROOF_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_PROOF_MIME_TYPES)[number])) {
    return cb(ApiError.badRequest("Only JPG, PNG, or WEBP images are allowed") as unknown as Error);
  }
  cb(null, true);
}

const storage = multer.memoryStorage();

export const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PROOF_FILE_SIZE_BYTES, files: 1 },
}).single("proof");

export const uploadQrImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PROOF_FILE_SIZE_BYTES, files: 1 },
}).single("qrImage");