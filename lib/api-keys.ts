import crypto from "node:crypto"
import { db } from "~/services/db"

// Re-export scopes and validation from the shared (client-safe) module
export { VALID_SCOPES, type ApiKeyScope, validateScopes, hasRequiredScopes } from "~/lib/api-key-scopes"

/** Prefix for all ColdEmailKit API keys */
const API_KEY_PREFIX = "cek_"

/**
 * Generate a new API key with cryptographic randomness.
 * Returns the raw key (shown once), its SHA-256 hash (stored in DB),
 * and a display prefix for identification.
 *
 * @returns Object containing rawKey, keyHash, and keyPrefix
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomBytes = crypto.randomBytes(32)
  const rawKey = `${API_KEY_PREFIX}${randomBytes.toString("base64url")}`
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12)

  return { rawKey, keyHash, keyPrefix }
}

/**
 * Hash an API key using SHA-256.
 * This is a one-way operation — the raw key cannot be recovered from the hash.
 *
 * @param rawKey - The raw API key string to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex")
}

/**
 * Verify an API key by hashing it and looking up the hash in the database.
 * Returns the ApiKey record if valid, or null if invalid/revoked/expired.
 *
 * @param rawKey - The raw API key from the Authorization header
 * @returns The ApiKey record with user info, or null if invalid
 */
export async function verifyApiKey(rawKey: string) {
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null
  }

  const keyHash = hashApiKey(rawKey)

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, role: true, email: true, name: true } } },
  })

  if (!apiKey) {
    return null
  }

  // Check if key is revoked
  if (apiKey.isRevoked) {
    return null
  }

  // Check if key is expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  return apiKey
}

/**
 * Log an API key usage event to the audit trail.
 *
 * @param params - The log entry parameters
 */
export async function logApiKeyUsage(params: {
  apiKeyId: string
  endpoint: string
  method: string
  statusCode: number
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await db.$transaction([
      db.apiKeyLog.create({ data: params }),
      db.apiKey.update({
        where: { id: params.apiKeyId },
        data: { lastUsedAt: new Date() },
      }),
    ])
  } catch (error) {
    // Log but don't fail the request if audit logging fails
    console.error("Failed to log API key usage:", error)
  }
}
