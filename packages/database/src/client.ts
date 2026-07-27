/// <reference types="node" />
import { PrismaClient } from "../generated/client";

// Prevents exhausting DB connections from hot-reload creating new clients in dev.
declare global {
  // eslint-disable-next-line no-var
  var __rentledgerPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__rentledgerPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__rentledgerPrisma = prisma;
}

export * from "../generated/client";
export default prisma;
