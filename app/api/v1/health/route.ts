import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyApiKey } from "~/lib/api-keys"
import { VALID_SCOPES } from "~/lib/api-key-scopes"

/**
 * GET /api/v1/health — Verify API key and return key metadata.
 * No specific scope required — any valid API key can access this.
 *
 * This endpoint is useful for:
 * - Verifying that an API key is valid and active
 * - Checking which scopes are granted
 * - Confirming connectivity to the API
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer cek_")) {
    return NextResponse.json(
      {
        status: "unauthenticated",
        error: "Missing or invalid API key. Use: Authorization: Bearer cek_xxx",
        availableScopes: VALID_SCOPES,
        endpoints: {
          health: "GET /api/v1/health",
          tools: "GET /api/v1/tools",
          toolDetail: "GET /api/v1/tools/:slug",
          submissions: "GET /api/v1/submissions",
          analytics: "GET /api/v1/analytics",
        },
      },
      { status: 401 },
    )
  }

  const rawKey = authHeader.slice(7)
  const apiKey = await verifyApiKey(rawKey)

  if (!apiKey) {
    return NextResponse.json(
      { status: "invalid", error: "API key is invalid, revoked, or expired" },
      { status: 401 },
    )
  }

  return NextResponse.json({
    status: "healthy",
    key: {
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
    },
    endpoints: {
      health: "GET /api/v1/health",
      tools: "GET /api/v1/tools?page=1&limit=25&q=search",
      toolDetail: "GET /api/v1/tools/:slug",
      submissions: "GET /api/v1/submissions?page=1&limit=25",
      analytics: "GET /api/v1/analytics",
    },
  })
}
