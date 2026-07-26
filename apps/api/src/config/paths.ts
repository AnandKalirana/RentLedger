import path from "path";
import { env } from "@/config/env";

// Resolves relative to this package's own folder (apps/api), not process.cwd().
// This guarantees multer (writing) and express.static (reading) always agree
// on the same absolute directory, regardless of how/where `npm run dev` is
// invoked from (monorepo root vs. this package vs. a built dist/ folder).
export const UPLOAD_DIR = path.isAbsolute(env.LOCAL_UPLOAD_DIR)
  ? env.LOCAL_UPLOAD_DIR
  : path.resolve(__dirname, "..", "..", env.LOCAL_UPLOAD_DIR);