import multer from "multer";
import path from "path";
import crypto from "crypto";
import { ALLOWED_PROOF_MIME_TYPES, MAX_PROOF_FILE_SIZE_BYTES } from "@rentledger/shared";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";
import { UPLOAD_DIR } from "@/config/paths";

// Local disk storage for dev / small deployments. Swap the `storage` value for a
// multer-s3 (or similar) storage engine when STORAGE_DRIVER=s3 — the fileFilter
// and size limit rules below stay identical either way.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

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

export const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PROOF_FILE_SIZE_BYTES, files: 1 },
}).single("proof");

const qrStorage = multer.diskStorage({
destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `qr-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

export const uploadQrImage = multer({
  storage: qrStorage,
  fileFilter,
  limits: { fileSize: MAX_PROOF_FILE_SIZE_BYTES, files: 1 },
}).single("qrImage");
