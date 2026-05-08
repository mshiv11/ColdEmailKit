import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/categories/[id] — Get a category by ID or slug.
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["categories:read"], async () => {
    const { id } = await params

    const category = await db.category.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        tools: { select: { id: true, name: true, slug: true } },
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ category })
  })(req)
}

/**
 * PUT /api/categories/[id] — Update a category.
 */
export const PUT = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["categories:write"], async () => {
    const { id } = await params
    const body = await req.json()

    const existing = await db.category.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const { tools, ...data } = body
    delete data.id
    delete data.createdAt
    delete data.updatedAt

    const updateData: Record<string, unknown> = { ...data }
    if (tools !== undefined) {
      updateData.tools = { set: tools.map((tid: string) => ({ id: tid })) }
    }

    const category = await db.category.update({
      where: { id: existing.id },
      data: updateData,
      include: { tools: { select: { id: true, name: true, slug: true } } },
    })

    return NextResponse.json({ category })
  })(req)
}

export const PATCH = PUT

/**
 * DELETE /api/categories/[id] — Delete a category.
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["categories:write"], async () => {
    const { id } = await params

    const existing = await db.category.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, slug: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await db.category.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true, deleted: existing.slug })
  })(req)
}
