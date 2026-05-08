import { ComparisonStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/comparisons — List all comparisons with pagination.
 * Requires: comparisons:read scope
 */
export const GET = withApiKeyAuth(["comparisons:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")))
  const status = searchParams.get("status") || undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) {
    where.status = status as ComparisonStatus
  }

  const [comparisons, totalCount] = await db.$transaction([
    db.comparison.findMany({
      where,
      select: {
        id: true,
        tool1Id: true,
        tool2Id: true,
        verdict: true,
        customTitle: true,
        customDescription: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        tool1: { select: { id: true, name: true, slug: true } },
        tool2: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.comparison.count({ where }),
  ])

  return NextResponse.json({
    comparisons,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  })
})

/**
 * POST /api/comparisons — Create or update a comparison.
 * Requires: comparisons:write scope
 *
 * Body: { tool1Id, tool2Id, verdict, customTitle, customDescription,
 *         overviewContent, tool1Description, tool2Description, status }
 */
export const POST = withApiKeyAuth(["comparisons:write"], async (req) => {
  const body = await req.json()
  const {
    tool1Id, tool2Id, verdict, customTitle, customDescription,
    overviewContent, tool1Description, tool2Description,
    status = "Draft",
  } = body

  if (!tool1Id || !tool2Id) {
    return NextResponse.json({ error: "tool1Id and tool2Id are required" }, { status: 400 })
  }

  // Enforce alphabetical ordering of IDs for the unique constraint
  const [id1, id2] = [tool1Id, tool2Id].sort()
  const finalTool1Desc = id1 === tool1Id ? tool1Description : tool2Description
  const finalTool2Desc = id1 === tool1Id ? tool2Description : tool1Description

  const comparison = await db.comparison.upsert({
    where: {
      tool1Id_tool2Id: { tool1Id: id1, tool2Id: id2 },
    },
    create: {
      tool1Id: id1,
      tool2Id: id2,
      verdict: verdict || null,
      customTitle: customTitle || null,
      customDescription: customDescription || null,
      overviewContent: overviewContent || null,
      tool1Description: finalTool1Desc || null,
      tool2Description: finalTool2Desc || null,
      status: status as ComparisonStatus,
      ...(status === "Published" ? { publishedAt: new Date() } : {}),
    },
    update: {
      verdict: verdict || null,
      customTitle: customTitle || null,
      customDescription: customDescription || null,
      overviewContent: overviewContent || null,
      tool1Description: finalTool1Desc || null,
      tool2Description: finalTool2Desc || null,
      status: status as ComparisonStatus,
    },
    include: {
      tool1: { select: { id: true, name: true, slug: true } },
      tool2: { select: { id: true, name: true, slug: true } },
    },
  })

  return NextResponse.json({ comparison }, { status: 201 })
})
