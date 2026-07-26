import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import { env, isProduction } from "@/config/env";
import { defaultRateLimiter } from "@/middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import routes from "@/routes";
import { UPLOAD_DIR } from "@/config/paths";

export function createApp() {
  const app = express();

  // Trust the first proxy hop (needed for correct client IPs behind a load balancer,
  // and for `secure` cookies to work correctly when TLS terminates upstream).
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(defaultRateLimiter);

  app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Local storage mode only — files are served directly. In s3 mode, files are
  // served from the bucket/CDN and this route is never hit.
  //
  // helmet() sets Cross-Origin-Resource-Policy: same-origin by default, which
  // blocks the browser from loading these images when the frontend runs on a
  // different origin (e.g. :3000 loading from the API on :4000). These files
  // are meant to be publicly viewable proof/QR images, so relax just this route.
  if (env.STORAGE_DRIVER === "local") {
    app.use(
      "/uploads",
      (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
      },
      express.static(UPLOAD_DIR)
    );
  }

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
