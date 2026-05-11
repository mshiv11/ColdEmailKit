import * as fs from "node:fs/promises"
import * as path from "node:path"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"

const POSTS_DIR = path.join(process.cwd(), "content/posts")

/**
 * GET /api/blog — List all blog posts with metadata.
 * Requires: blog:read scope
 */
export const GET = withApiKeyAuth(["blog:read"], async (req) => {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q") || undefined

  try {
    const files = await fs.readdir(POSTS_DIR)
    const mdxFiles = files.filter(f => f.endsWith(".mdx"))

    const posts = await Promise.all(
      mdxFiles.map(async (filename) => {
        const slug = filename.replace(/\.mdx$/, "")
        const content = await fs.readFile(path.join(POSTS_DIR, filename), "utf-8")

        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        if (!frontmatterMatch) return null

        const fm = frontmatterMatch[1]
        const meta: Record<string, string> = {}

        for (const line of fm.split(/\r?\n/)) {
          if (line.startsWith("  ")) continue // skip nested
          const match = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/)
          if (match) meta[match[1]] = match[2]
        }

        return {
          slug,
          title: meta.title || slug,
          description: meta.description || "",
          publishedAt: meta.publishedAt || "",
          image: meta.image || null,
        }
      }),
    )

    let filteredPosts = posts.filter(Boolean)

    if (q) {
      const query = q.toLowerCase()
      filteredPosts = filteredPosts.filter(
        (p) =>
          p && (p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)),
      )
    }

    // Sort by publishedAt descending
    filteredPosts.sort((a, b) => {
      const da = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const db2 = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return db2 - da
    })

    return NextResponse.json({
      posts: filteredPosts,
      totalCount: filteredPosts.length,
    })
  } catch {
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

  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)

  // Check if already exists
  try {
    await fs.access(filePath)
    return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
  } catch {
    // File doesn't exist — good
  }

  const frontmatter = buildFrontmatter({
    title, description, image,
    publishedAt: publishedAt || new Date().toISOString().split("T")[0],
    authorName: authorName || "ColdEmailKit",
    authorImage: authorImage || "/authors/default.jpg",
    authorTwitter: authorTwitter || "@coldemailkit",
    tools,
  })

  await fs.writeFile(filePath, `${frontmatter}\n\n${content}`, "utf-8")

  // Trigger ISR revalidation so the new post appears on the live site
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)

  return NextResponse.json({ success: true, slug }, { status: 201 })
})

function buildFrontmatter(meta: Record<string, unknown>): string {
  const lines = ["---"]
  lines.push(`title: "${meta.title}"`)
  lines.push(`description: "${meta.description || ""}"`)
  if (meta.image) lines.push(`image: "${meta.image}"`)
  lines.push(`publishedAt: ${meta.publishedAt}`)
  lines.push("author:")
  lines.push(`  name: ${meta.authorName}`)
  lines.push(`  image: "${meta.authorImage}"`)
  lines.push(`  twitterHandle: "${meta.authorTwitter}"`)

  const tools = meta.tools as string[] | undefined
  if (tools?.length) {
    lines.push("tools:")
    for (const t of tools) {
      lines.push(`  - ${t}`)
    }
  }

  lines.push("---")
  return lines.join("\n")
}
