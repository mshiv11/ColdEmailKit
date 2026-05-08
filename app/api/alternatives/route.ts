import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/alternatives — List all alternatives with pagination.
 * Requires: alternatives:read scope
 */
export const GET = withApiKeyAuth(["alternatives:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "25")))
  const q = searchParams.get("q") || undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [alternatives, totalCount] = await db.$transaction([
    db.alternative.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        description: true,
        faviconUrl: true,
        discountCode: true,
        discountAmount: true,
        pageviews: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { tools: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    db.alternative.count({ where }),
  ])

  return NextResponse.json({
    alternatives,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  })
})

/**
 * POST /api/alternatives — Create a new alternative.
 * Requires: alternatives:write scope
 */
export const POST = withApiKeyAuth(["alternatives:write"], async (req) => {
  const body = await req.json()
  const { name, websiteUrl, description, faviconUrl, discountCode, discountAmount, customTitle, tools } = body

  if (!name || !websiteUrl) {
    return NextResponse.json({ error: "name and websiteUrl are required" }, { status: 400 })
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const alternative = await db.alternative.create({
    data: {
      name,
      slug,
      websiteUrl,
      description: description || null,
      faviconUrl: faviconUrl || null,
      discountCode: discountCode || null,
      discountAmount: discountAmount || null,
      customTitle: customTitle || null,
      ...(tools?.length ? { tools: { connect: tools.map((id: string) => ({ id })) } } : {}),
    },
    include: {
      tools: { select: { id: true, name: true, slug: true } },
    },
  })

  return NextResponse.json({ alternative }, { status: 201 })
})
