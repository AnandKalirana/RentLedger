import { PrismaClient } from "../generated/client";

declare const process: { env: Record<string, string | undefined> };

declare global {
  // eslint-disable-next-line no-var
  var __rentledgerPrisma: PrismaClient | undefined;
}

const g = globalThis as unknown as { __rentledgerPrisma?: PrismaClient };

export const prisma =
  g.__rentledgerPrisma ??
  new PrismaClient({
    log: process?.env?.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process?.env?.NODE_ENV !== "production") {
  g.__rentledgerPrisma = prisma;
}

export * from "../generated/client";
export default prisma;
