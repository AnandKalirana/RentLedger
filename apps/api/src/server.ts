import { createApp } from "@/app";
import { env } from "@/config/env";
import { connectDatabase, disconnectDatabase } from "@/config/database";

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`RentLedger API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received: shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
