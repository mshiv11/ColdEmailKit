import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/alternatives/[id] — Get an alternative by ID or slug.
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["alternatives:read"], async () => {
    const { id } = await params

    const alternative = await db.alternative.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        tools: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!alternative) {
      return NextResponse.json({ error: "Alternative not found" }, { status: 404 })
    }

    return NextResponse.json({ alternative })
  })(req)
}

/**
 * PUT /api/alternatives/[id] — Update an alternative.
 */
export const PUT = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["alternatives:write"], async () => {
    const { id } = await params
    const body = await req.json()

    const existing = await db.alternative.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!existing) {
      return NextResponse.json({ error: "Alternative not found" }, { status: 404 })
    }

    const { tools, ...data } = body
    delete data.id
    delete data.createdAt
    delete data.updatedAt

    const updateData: Record<string, unknown> = { ...data }
    if (tools !== undefined) {
      updateData.tools = { set: tools.map((tid: string) => ({ id: tid })) }
    }

    const alternative = await db.alternative.update({
      where: { id: existing.id },
      data: updateData,
      include: { tools: { select: { id: true, name: true, slug: true } } },
    })

    return NextResponse.json({ alternative })
  })(req)
}

export const PATCH = PUT

/**
 * DELETE /api/alternatives/[id] — Delete an alternative.
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return withApiKeyAuth(["alternatives:write"], async () => {
    const { id } = await params

    const existing = await db.alternative.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, slug: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Alternative not found" }, { status: 404 })
    }

    await db.alternative.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true, deleted: existing.slug })
  })(req)
}
