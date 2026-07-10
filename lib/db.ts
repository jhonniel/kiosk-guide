import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  if (existing) {
    const hasDownloadToken = "downloadToken" in existing;
    if (hasDownloadToken) {
      return existing;
    }
    void (existing as PrismaClient).$disconnect();
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const db = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
