import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyApiKey } from "~/lib/api-keys"
import { VALID_SCOPES } from "~/lib/api-key-scopes"

/**
 * GET /api/health — Verify API key and return key metadata.
 * Also available at /api/v1/health.
 * No specific scope required — any valid API key can access this.
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
          health: "GET /api/health",
          tools: "GET /api/tools",
          toolDetail: "GET /api/tools/:slug",
          submissions: "GET /api/submissions",
          drafts: "GET /api/drafts",
          analytics: "GET /api/analytics",
          adminApiKeys: "GET /api/admin/api-keys (session auth only)",
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
      health: "GET /api/health",
      tools: "GET /api/tools?page=1&limit=25&q=search",
      toolDetail: "GET /api/tools/:slug",
      submissions: "GET /api/submissions?page=1&limit=25",
      drafts: "GET /api/drafts?page=1&limit=25",
      analytics: "GET /api/analytics",
    },
  })
}
