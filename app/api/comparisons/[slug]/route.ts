import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/comparisons/[slug] — Get a comparison by slug pair (e.g., "tool1-vs-tool2").
 * Also supports fetching by comparison ID directly.
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["comparisons:read"], async () => {
    const { slug } = await params

    // Try parsing as "slug1-vs-slug2"
    const vsMatch = slug.match(/^(.+)-vs-(.+)$/)

    let comparison
    if (vsMatch) {
      const [, slug1, slug2] = vsMatch

      // Look up tool IDs from slugs
      const tool1 = await db.tool.findFirst({ where: { slug: slug1 }, select: { id: true } })
      const tool2 = await db.tool.findFirst({ where: { slug: slug2 }, select: { id: true } })

      if (!tool1 || !tool2) {
        return NextResponse.json({ error: "One or both tools not found" }, { status: 404 })
      }

      const [id1, id2] = [tool1.id, tool2.id].sort()

      comparison = await db.comparison.findFirst({
        where: { tool1Id: id1, tool2Id: id2 },
        include: {
          tool1: { select: { id: true, name: true, slug: true } },
          tool2: { select: { id: true, name: true, slug: true } },
          faqs: { orderBy: { order: "asc" } },
        },
      })
    } else {
      // Try as comparison ID
      comparison = await db.comparison.findFirst({
        where: { id: slug },
        include: {
          tool1: { select: { id: true, name: true, slug: true } },
          tool2: { select: { id: true, name: true, slug: true } },
          faqs: { orderBy: { order: "asc" } },
        },
      })
    }

    if (!comparison) {
      return NextResponse.json({ error: "Comparison not found" }, { status: 404 })
    }

    return NextResponse.json({ comparison })
  })(req)
}

/**
 * DELETE /api/comparisons/[slug] — Delete a comparison by slug pair or ID.
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["comparisons:write"], async () => {
    const { slug } = await params

    const vsMatch = slug.match(/^(.+)-vs-(.+)$/)

    if (vsMatch) {
      const [, slug1, slug2] = vsMatch
      const tool1 = await db.tool.findFirst({ where: { slug: slug1 }, select: { id: true } })
      const tool2 = await db.tool.findFirst({ where: { slug: slug2 }, select: { id: true } })

      if (!tool1 || !tool2) {
        return NextResponse.json({ error: "One or both tools not found" }, { status: 404 })
      }

      const [id1, id2] = [tool1.id, tool2.id].sort()

      await db.comparison.deleteMany({
        where: { tool1Id: id1, tool2Id: id2 },
      })
    } else {
      await db.comparison.delete({ where: { id: slug } })
    }

    return NextResponse.json({ success: true })
  })(req)
}
