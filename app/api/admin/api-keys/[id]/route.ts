import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAdminAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * DELETE /api/admin/api-keys/[id] — Revoke an API key (soft-delete).
 * Sets isRevoked=true rather than deleting the record, preserving audit logs.
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withAdminAuth(async (_req, session) => {
    try {
      const { id } = await params

      if (!id) {
        return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
      }

      // Verify the key belongs to the requesting admin
      const apiKey = await db.apiKey.findFirst({
        where: { id, userId: session.user.id },
      })

      if (!apiKey) {
        return NextResponse.json({ error: "API key not found" }, { status: 404 })
      }

      if (apiKey.isSystem) {
        return NextResponse.json({ error: "System API keys cannot be revoked" }, { status: 403 })
      }

      if (apiKey.isRevoked) {
        return NextResponse.json({ error: "API key is already revoked" }, { status: 400 })
      }

      await db.apiKey.update({
        where: { id },
        data: { isRevoked: true },
      })

      return NextResponse.json({ message: "API key revoked successfully", id })
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
  })(req)
}
