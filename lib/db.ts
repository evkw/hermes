import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing POSTGRES_PRISMA_URL or DATABASE_URL environment variable");
  }
  const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  const pool = new pg.Pool({
    connectionString,
    ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
