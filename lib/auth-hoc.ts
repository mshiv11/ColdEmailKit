import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasRequiredScopes, logApiKeyUsage, verifyApiKey } from "~/lib/api-keys"
import { auth } from "~/lib/auth"
import { isRateLimited } from "~/lib/rate-limiter"

type WithAuthHandler = (req: NextRequest, session: typeof auth.$Infer.Session) => Promise<Response>

/**
 * Context passed to API key authenticated handlers.
 */
export type ApiKeyContext = {
  userId: string
  apiKeyId: string
  scopes: string[]
}

type WithApiKeyHandler = (req: NextRequest, context: ApiKeyContext) => Promise<Response>

/**
 * A higher order function that wraps a handler with authentication.
 * @param handler - The handler to wrap.
 * @returns A new handler that checks for authentication.
 */
export const withAuth = (handler: WithAuthHandler) => {
  return async (req: NextRequest) => {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return handler(req, session)
  }
}

/**
 * A higher order function that wraps a handler with admin authentication.
 * @param handler - The handler to wrap.
 * @returns A new handler that checks for admin authentication.
 */
export const withAdminAuth = (handler: WithAuthHandler) => {
  return withAuth(async (req, session) => {
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return handler(req, session)
  })
}

/**
 * A higher order function that wraps a handler with API key authentication.
 * Validates the Bearer token, checks scopes, applies rate limiting, and logs usage.
 *
 * @param requiredScopes - Scopes required to access this endpoint
 * @param handler - The handler to execute if authentication succeeds
 * @returns A new handler that checks for API key authentication
 */
export const withApiKeyAuth = (requiredScopes: string[], handler: WithApiKeyHandler) => {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer cek_")) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 })
    }

    const rawKey = authHeader.slice(7) // Remove "Bearer " prefix

    // Verify the API key
    const apiKey = await verifyApiKey(rawKey)

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid, revoked, or expired API key" }, { status: 401 })
    }

    // Check scopes
    if (!hasRequiredScopes(apiKey.scopes, requiredScopes)) {
      return NextResponse.json(
        { error: "Insufficient scopes", required: requiredScopes },
        { status: 403 },
      )
    }

    // Rate limiting
    const rateLimited = await isRateLimited(apiKey.id, "apiKey")

    if (rateLimited) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Execute handler and capture status code for logging
    const response = await handler(req, {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      scopes: apiKey.scopes,
    })

    // Log usage asynchronously (don't block the response)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip")
    const userAgent = req.headers.get("user-agent")

    logApiKeyUsage({
      apiKeyId: apiKey.id,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      statusCode: response.status,
      ipAddress,
      userAgent,
    })

    return response
  }
}
