import { prisma } from "@rentledger/database";

export { prisma };

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log("Database connected");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
