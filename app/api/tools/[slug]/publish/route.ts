import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * POST /api/tools/[slug]/publish — Publish a tool.
 * Requires: tools:write scope
 *
 * Sets the tool's status to Published, sets publishedAt to now (if not set),
 * and triggers all publish side effects (notifications, indexing, social posting).
 */
export const POST = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["tools:write"], async () => {
    const { slug } = await params

    const tool = await db.tool.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    if (tool.status === ToolStatus.Published) {
      return NextResponse.json({ message: "Tool is already published", tool: { id: tool.id, slug: tool.slug, status: tool.status } })
    }

    const updatedTool = await db.tool.update({
      where: { id: tool.id },
      data: {
        status: ToolStatus.Published,
        publishedAt: tool.publishedAt || new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        publishedAt: true,
      },
    })

    // Trigger publish side effects asynchronously
    try {
      const { executePublishSideEffects } = await import("~/server/admin/tools/publish")
      executePublishSideEffects(updatedTool.id, true).catch(console.error)
    } catch (e) {
      console.error("Publish side effects failed:", e)
    }

    return NextResponse.json({
      message: "Tool published successfully",
      tool: updatedTool,
    })
  })(req)
}
