import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyApiKey } from "~/lib/api-keys"
import { VALID_SCOPES } from "~/lib/api-key-scopes"

/**
 * GET /api/health — Verify API key and return key metadata + endpoint discovery.
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
        endpoints: getEndpointDiscovery(),
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
    endpoints: getEndpointDiscovery(),
  })
}

function getEndpointDiscovery() {
  return {
    health: "GET /api/health",
    tools: {
      list: "GET /api/tools?page=1&limit=25&q=search&status=Published",
      create: "POST /api/tools",
      get: "GET /api/tools/:slug",
      update: "PUT /api/tools/:slug",
      delete: "DELETE /api/tools/:slug",
      publish: "POST /api/tools/:slug/publish",
    },
    alternatives: {
      list: "GET /api/alternatives?page=1&limit=25&q=search",
      create: "POST /api/alternatives",
      get: "GET /api/alternatives/:id",
      update: "PUT /api/alternatives/:id",
      delete: "DELETE /api/alternatives/:id",
    },
    comparisons: {
      list: "GET /api/comparisons?page=1&limit=25&status=Published",
      create: "POST /api/comparisons",
      get: "GET /api/comparisons/:slug (e.g., tool1-vs-tool2)",
      delete: "DELETE /api/comparisons/:slug",
    },
    blog: {
      list: "GET /api/blog?q=search",
      create: "POST /api/blog",
      get: "GET /api/blog/:slug",
      update: "PUT /api/blog/:slug",
      delete: "DELETE /api/blog/:slug",
    },
    categories: {
      list: "GET /api/categories?page=1&limit=50&q=search",
      create: "POST /api/categories",
      get: "GET /api/categories/:id",
      update: "PUT /api/categories/:id",
      delete: "DELETE /api/categories/:id",
    },
    analytics: "GET /api/analytics",
    submissions: "GET /api/submissions?page=1&limit=25",
    drafts: "GET /api/drafts?page=1&limit=25",
  }
}
