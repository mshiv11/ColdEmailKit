import { slugify } from "@primoui/utils"
import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/tools/[slug] — Get a single tool by slug or ID.
 * Requires: tools:read scope
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["tools:read"], async () => {
    const { slug } = await params

    const tool = await db.tool.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        alternatives: { select: { id: true, name: true, slug: true } },
        integrations: { select: { id: true, name: true, slug: true } },
        license: true,
      },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    return NextResponse.json({ tool })
  })(req)
}

/**
 * PUT /api/tools/[slug] — Update a tool by slug or ID.
 * Requires: tools:write scope
 *
 * Body: Partial tool fields to update. Supports:
 *   name, tagline, description, content, websiteUrl, status,
 *   publishedAt, isFeatured, categories (array of IDs),
 *   alternatives (array of IDs), specifications, features, ratings, etc.
 */
export const PUT = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["tools:write"], async () => {
    const { slug } = await params
    const body = await req.json()

    const tool = await db.tool.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    // Extract relation IDs from body
    const { categories, alternatives, integrations, ...data } = body

    // Clean up: remove fields that shouldn't be directly set
    delete data.id
    delete data.createdAt
    delete data.updatedAt

    // Handle slug generation
    if (data.name && !data.slug) {
      data.slug = slugify(data.name)
    }

    // Handle publishedAt date coercion
    if (data.publishedAt) {
      data.publishedAt = new Date(data.publishedAt)
    }

    // Handle status change to Published
    if (data.status === "Published" && tool.status !== "Published") {
      if (!data.publishedAt) {
        data.publishedAt = new Date()
      }
    }

    const updateData: Record<string, unknown> = { ...data }

    // Handle relations
    if (categories !== undefined) {
      updateData.categories = { set: categories.map((id: string) => ({ id })) }
    }
    if (alternatives !== undefined) {
      updateData.alternatives = { set: alternatives.map((id: string) => ({ id })) }
    }
    if (integrations !== undefined) {
      updateData.integrations = { set: integrations.map((id: string) => ({ id })) }
    }

    const updatedTool = await db.tool.update({
      where: { id: tool.id },
      data: updateData,
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        alternatives: { select: { id: true, name: true, slug: true } },
        integrations: { select: { id: true, name: true, slug: true } },
      },
    })

    // If just published, trigger side effects
    if (updatedTool.status === "Published" && tool.status !== "Published") {
      try {
        const { executePublishSideEffects } = await import(
          "~/server/admin/tools/publish"
        )
        executePublishSideEffects(updatedTool.id, false).catch(console.error)
      } catch (e) {
        console.error("Publish side effects failed:", e)
      }
    }

    return NextResponse.json({ tool: updatedTool })
  })(req)
}

/**
 * PATCH /api/tools/[slug] — Partial update (alias for PUT).
 */
export const PATCH = PUT

/**
 * DELETE /api/tools/[slug] — Delete a tool by slug or ID.
 * Requires: tools:write scope
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["tools:write"], async () => {
    const { slug } = await params

    const tool = await db.tool.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { id: true, slug: true },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    await db.tool.delete({ where: { id: tool.id } })

    return NextResponse.json({ success: true, deleted: tool.slug })
  })(req)
}
