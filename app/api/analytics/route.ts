import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/analytics — Dashboard analytics overview.
 * Alias for /api/v1/analytics for agent compatibility.
 * Requires: analytics:read scope
 */
export const GET = withApiKeyAuth(["analytics:read"], async () => {
  const [
    totalTools,
    publishedTools,
    draftTools,
    scheduledTools,
    totalCategories,
    totalAlternatives,
    recentlyPublished,
    topRated,
  ] = await db.$transaction([
    db.tool.count(),
    db.tool.count({ where: { status: ToolStatus.Published } }),
    db.tool.count({ where: { status: ToolStatus.Draft } }),
    db.tool.count({ where: { status: ToolStatus.Scheduled } }),
    db.category.count(),
    db.alternative.count(),
    db.tool.findMany({
      where: { status: ToolStatus.Published },
      select: {
        name: true,
        slug: true,
        publishedAt: true,
        overallRating: true,
        totalReviews: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    db.tool.findMany({
      where: {
        status: ToolStatus.Published,
        overallRating: { not: null },
      },
      select: {
        name: true,
        slug: true,
        overallRating: true,
        totalReviews: true,
        trustScore: true,
      },
      orderBy: { overallRating: "desc" },
      take: 10,
    }),
  ])

  return NextResponse.json({
    overview: {
      totalTools,
      publishedTools,
      draftTools,
      scheduledTools,
      totalCategories,
      totalAlternatives,
    },
    recentlyPublished,
    topRated,
  })
})
