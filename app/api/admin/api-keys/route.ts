import { NextResponse } from "next/server"
import { z } from "zod"
import { VALID_SCOPES, generateApiKey, validateScopes } from "~/lib/api-keys"
import { withAdminAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  expiresInDays: z.number().int().positive().optional(),
})

/**
 * POST /api/admin/api-keys — Create a new API key.
 * Returns the raw key exactly once; it cannot be retrieved after creation.
 */
export const POST = withAdminAuth(async (req, session) => {
  try {
    const body = await req.json()
    const parsed = createApiKeySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, scopes, expiresInDays } = parsed.data

    // Validate scopes
    if (!validateScopes(scopes)) {
      return NextResponse.json(
        { error: "Invalid scopes provided", validScopes: VALID_SCOPES },
        { status: 400 },
      )
    }

    // Generate key
    const { rawKey, keyHash, keyPrefix } = generateApiKey()

    // Calculate expiration date
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Store in database
    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        scopes,
        expiresAt,
        userId: session.user.id,
      },
    })

    // Return the raw key — this is the only time it's ever visible
    return NextResponse.json({
      id: apiKey.id,
      rawKey,
      keyPrefix,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      message: "Save this key now — it will not be shown again.",
    })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
})

/**
 * GET /api/admin/api-keys — List all API keys for the admin.
 * Never returns the key hash.
 */
export const GET = withAdminAuth(async (_req, session) => {
  try {
    const apiKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
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

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Failed to list API keys:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
})
