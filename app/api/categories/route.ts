import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/categories — List all categories with pagination.
 * Requires: categories:read scope
 */
export const GET = withApiKeyAuth(["categories:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")))
  const q = searchParams.get("q") || undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { label: { contains: q, mode: "insensitive" } },
    ]
  }

  const [categories, totalCount] = await db.$transaction([
    db.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        label: true,
        fullPath: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { tools: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    db.category.count({ where }),
  ])

  return NextResponse.json({
    categories,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  })
})

/**
 * POST /api/categories — Create a new category.
 * Requires: categories:write scope
 */
export const POST = withApiKeyAuth(["categories:write"], async (req) => {
  const body = await req.json()
  const { name, label, slug: inputSlug, parentId, tools } = body

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const slug = inputSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const category = await db.category.create({
    data: {
      name,
      slug,
      label: label || null,
      parentId: parentId || null,
      fullPath: slug, // Will be updated properly below
      ...(tools?.length ? { tools: { connect: tools.map((id: string) => ({ id })) } } : {}),
    },
    include: {
      tools: { select: { id: true, name: true, slug: true } },
    },
  })

  return NextResponse.json({ category }, { status: 201 })
})
