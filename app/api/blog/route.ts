import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"
import { Prisma } from "@prisma/client"

/**
 * GET /api/blog — List all blog posts with metadata.
 * Requires: blog:read scope
 */
export const GET = withApiKeyAuth(["blog:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q") || undefined

  try {
    const whereClause: Prisma.BlogPostWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}

    const posts = await db.blogPost.findMany({
      where: whereClause,
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        imageUrl: true,
      },
    })

    const formattedPosts = posts.map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description || "",
      publishedAt: p.publishedAt,
      image: p.imageUrl,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      totalCount: formattedPosts.length,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ posts: [], totalCount: 0 })
  }
})

/**
 * POST /api/blog — Create a new blog post.
 * Requires: blog:write scope
 *
 * Body: { slug, title, description, image?, publishedAt, authorName,
 *         authorImage, authorTwitter, tools?, content }
 */
export const POST = withApiKeyAuth(["blog:write"], async (req) => {
  const body = await req.json()
  const { slug, title, description, image, publishedAt, authorName, authorImage, authorTwitter, tools, content } = body

  if (!slug || !title || !content) {
    return NextResponse.json(
      { error: "slug, title, and content are required" },
      { status: 400 },
    )
  }

  // Check if already exists
  const existing = await db.blogPost.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
  }

  try {
    // Only connect tools that exist to avoid Prisma errors
    let validToolSlugs: string[] = []
    if (tools && Array.isArray(tools) && tools.length > 0) {
      const existingTools = await db.tool.findMany({
        where: { slug: { in: tools } },
        select: { slug: true }
      })
      validToolSlugs = existingTools.map(t => t.slug)
    }

    await db.blogPost.create({
      data: {
        slug,
        title,
        description: description || null,
        imageUrl: image || null,
        content,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        authorName: authorName || "ColdEmailKit",
        authorImage: authorImage || "/authors/default.jpg",
        authorTwitter: authorTwitter || "@coldemailkit",
        ...(validToolSlugs.length > 0 && {
          tools: {
            connect: validToolSlugs.map(t => ({ slug: t }))
          }
        })
      }
    })

    // Trigger ISR revalidation so the new post appears on the live site
    revalidatePath("/blog")
    revalidatePath(`/blog/${slug}`)

    return NextResponse.json({ success: true, slug }, { status: 201 })
  } catch (error) {
    console.error("Failed to create post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
