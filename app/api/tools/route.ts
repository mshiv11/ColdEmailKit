import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/tools — List published tools with pagination.
 * Alias for /api/v1/tools for agent compatibility.
 * Requires: tools:read scope
 *
 * Query params:
 *   ?page=1&limit=25&q=searchterm&status=Published
 */
export const GET = withApiKeyAuth(["tools:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")))
  const q = searchParams.get("q") || undefined
  const status = searchParams.get("status") || "Published"
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    status: status as ToolStatus,
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [tools, totalCount] = await db.$transaction([
    db.tool.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        tagline: true,
        description: true,
        faviconUrl: true,
        screenshotUrl: true,
        isFeatured: true,
        stars: true,
        forks: true,
        overallRating: true,
        totalReviews: true,
        trustScore: true,
        pricingStarting: true,
        bestFor: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: { name: true, slug: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { score: "desc" }],
      take: limit,
      skip,
    }),
    db.tool.count({ where }),
  ])

  return NextResponse.json({
    tools,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  })
})

/**
 * POST /api/tools — Create a new tool submission.
 * Requires: tools:write scope
 */
export const POST = withApiKeyAuth(["tools:write"], async (req) => {
  try {
    const body = await req.json()
    const { name, websiteUrl, tagline, description } = body

    if (!name || !websiteUrl) {
      return NextResponse.json(
        { error: "name and websiteUrl are required" },
        { status: 400 },
      )
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const tool = await db.tool.create({
      data: {
        name,
        slug,
        websiteUrl,
        tagline: tagline || null,
        description: description || null,
        status: ToolStatus.Draft,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ tool, message: "Tool created as draft" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create tool:", error)
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 })
  }
})
