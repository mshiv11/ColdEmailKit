import { NextResponse } from "next/server"
import { withAdminAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/admin/api-keys/[id]/usage — View usage logs for a specific API key.
 * Returns the last used timestamp, total request count, and recent log entries.
 */
export const GET = withAdminAuth(async (req, session) => {
  try {
    // Extract the key ID from the URL path
    const segments = req.nextUrl.pathname.split("/")
    const keyIdIndex = segments.indexOf("api-keys") + 1
    const id = segments[keyIdIndex]

    if (!id) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
    }

    // Verify the key belongs to the requesting admin
    const apiKey = await db.apiKey.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
      },
    })

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    // Get total request count
    const totalRequests = await db.apiKeyLog.count({
      where: { apiKeyId: id },
    })

    // Get recent logs (last 50)
    const recentLogs = await db.apiKeyLog.findMany({
      where: { apiKeyId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        ipAddress: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        lastUsedAt: apiKey.lastUsedAt,
      },
      totalRequests,
      recentLogs,
    })
  } catch (error) {
    console.error("Failed to fetch API key usage:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
})
