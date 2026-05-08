import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/drafts — List draft tools awaiting review.
 * Requires: submissions:manage scope
 *
 * Query params:
 *   ?page=1&limit=25
 */
export const GET = withApiKeyAuth(["submissions:manage"], async (req) => {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")))
  const skip = (page - 1) * limit

  const where = {
    status: ToolStatus.Draft,
  }

  const [drafts, totalCount] = await db.$transaction([
    db.tool.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        tagline: true,
        description: true,
        status: true,
        submitterName: true,
        submitterEmail: true,
        submitterNote: true,
        faviconUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.tool.count({ where }),
  ])

  return NextResponse.json({
    drafts,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  })
})
