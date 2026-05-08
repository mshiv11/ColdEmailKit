import { db } from "~/services/db"

/**
 * Find all API keys for the admin user, ordered by creation date (newest first).
 * Never returns the keyHash field.
 */
export const findApiKeys = async (userId: string) => {
  return db.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      isRevoked: true,
      createdAt: true,
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export type ApiKeyListItem = Awaited<ReturnType<typeof findApiKeys>>[number]

/**
 * Find usage logs for a specific API key.
 */
export const findApiKeyUsage = async (apiKeyId: string, limit = 50) => {
  const [totalRequests, recentLogs] = await db.$transaction([
    db.apiKeyLog.count({ where: { apiKeyId } }),
    db.apiKeyLog.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
  ])

  return { totalRequests, recentLogs }
}
