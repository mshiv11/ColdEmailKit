import { PrismaClient } from "@prisma/client"

type GlobalPrisma = {
  db?: PrismaClient & { __databaseUrl?: string }
}

const globalForPrisma = global as unknown as GlobalPrisma

const shouldUseDirectDatabaseUrl =
  !!process.env.DATABASE_URL_UNPOOLED &&
  (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build")

const databaseUrl = shouldUseDirectDatabaseUrl
  ? process.env.DATABASE_URL_UNPOOLED
  : process.env.DATABASE_URL

const existingDb = globalForPrisma.db
const shouldReuseExistingDb = existingDb && existingDb.__databaseUrl === databaseUrl

if (existingDb && !shouldReuseExistingDb) {
  void existingDb.$disconnect().catch(() => undefined)
}

export const db =
  (shouldReuseExistingDb ? existingDb : undefined) ||
  Object.assign(
    new PrismaClient({
      ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    }),
    { __databaseUrl: databaseUrl },
  )

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db
