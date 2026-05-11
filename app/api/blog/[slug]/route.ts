import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/blog/[slug] — Read a blog post by slug.
 * Requires: blog:read scope
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["blog:read"], async () => {
    const { slug } = await params

    try {
      const post = await db.blogPost.findUnique({
        where: { slug },
        include: {
          tools: { select: { slug: true } }
        }
      })

      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
      }

      const meta: Record<string, unknown> = {
        title: post.title,
        description: post.description,
        image: post.imageUrl,
        publishedAt: post.publishedAt,
        author: {
          name: post.authorName,
          image: post.authorImage,
          twitterHandle: post.authorTwitter,
        },
      }

      if (post.tools.length > 0) {
        meta.tools = post.tools.map(t => t.slug)
      }

      return NextResponse.json({
        slug,
        frontmatter: meta,
        content: post.content,
      })
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  })(req)
}

/**
 * PUT /api/blog/[slug] — Update a blog post.
 * Requires: blog:write scope
 *
 * Body: { title, description, image?, publishedAt, authorName,
 *         authorImage, authorTwitter, tools?, content, newSlug? }
 */
export const PUT = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["blog:write"], async () => {
    const { slug } = await params
    const body = await req.json()
    const { title, description, image, publishedAt, authorName, authorImage, authorTwitter, tools, content, newSlug } = body

    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    const finalSlug = newSlug || slug

    try {
      // Connect only valid tools
      let validToolSlugs: string[] = []
      if (tools && Array.isArray(tools)) {
        const existingTools = await db.tool.findMany({
          where: { slug: { in: tools } },
          select: { slug: true }
        })
        validToolSlugs = existingTools.map(t => t.slug)
      }

      await db.blogPost.update({
        where: { slug },
        data: {
          ...(newSlug && newSlug !== slug && { slug: newSlug }),
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description: description || null }),
          ...(image !== undefined && { imageUrl: image || null }),
          ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
          ...(authorName !== undefined && { authorName }),
          ...(authorImage !== undefined && { authorImage: authorImage || null }),
          ...(authorTwitter !== undefined && { authorTwitter: authorTwitter || null }),
          ...(content !== undefined && { content }),
          ...(tools !== undefined && {
            tools: {
              set: [], // Disconnect old tools
              connect: validToolSlugs.map(t => ({ slug: t }))
            }
          })
        }
      })

      // Trigger ISR revalidation so the edit is reflected on the live site
      revalidatePath("/blog")
      revalidatePath(`/blog/${slug}`)
      if (newSlug && newSlug !== slug) {
        revalidatePath(`/blog/${newSlug}`)
      }

      return NextResponse.json({ success: true, slug: finalSlug })
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  })(req)
}

export const PATCH = PUT

/**
 * DELETE /api/blog/[slug] — Delete a blog post.
 * Requires: blog:write scope
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["blog:write"], async () => {
    const { slug } = await params

    try {
      await db.blogPost.delete({
        where: { slug }
      })

      // Trigger ISR revalidation so the deletion is reflected on the live site
      revalidatePath("/blog")
      revalidatePath(`/blog/${slug}`)

      return NextResponse.json({ success: true, deleted: slug })
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }
  })(req)
}
