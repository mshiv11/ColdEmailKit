import * as fs from "node:fs/promises"
import * as path from "node:path"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"

const POSTS_DIR = path.join(process.cwd(), "content/posts")

/**
 * GET /api/blog/[slug] — Read a blog post by slug.
 * Requires: blog:read scope
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["blog:read"], async () => {
    const { slug } = await params
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`)

    try {
      const fileContent = await fs.readFile(filePath, "utf-8")

      const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      const content = frontmatterMatch
        ? fileContent.slice(frontmatterMatch[0].length).trim()
        : fileContent

      // Parse frontmatter
      const meta: Record<string, unknown> = {}
      const authorObj: Record<string, string> = {}
      const toolsArr: string[] = []
      let inAuthor = false
      let inTools = false

      if (frontmatterMatch) {
        for (const line of frontmatterMatch[1].split(/\r?\n/)) {
          if (line.startsWith("author:")) { inAuthor = true; inTools = false; continue }
          if (line.startsWith("tools:")) { inTools = true; inAuthor = false; continue }
          if (inAuthor && line.startsWith("  ")) {
            const m = line.match(/^\s+(\w+):\s*["']?(.+?)["']?\s*$/)
            if (m) authorObj[m[1]] = m[2]
            continue
          }
          if (inTools && line.startsWith("  -")) {
            toolsArr.push(line.replace(/^\s+-\s*/, "").trim())
            continue
          }
          inAuthor = false; inTools = false
          const m = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/)
          if (m) meta[m[1]] = m[2]
        }
      }

      if (Object.keys(authorObj).length) meta.author = authorObj
      if (toolsArr.length) meta.tools = toolsArr

      return NextResponse.json({
        slug,
        frontmatter: meta,
        content,
      })
    } catch {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
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

    const currentPath = path.join(POSTS_DIR, `${slug}.mdx`)

    // Make sure existing file exists
    try {
      await fs.access(currentPath)
    } catch {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    const finalSlug = newSlug || slug
    const newPath = path.join(POSTS_DIR, `${finalSlug}.mdx`)

    // Build new content
    const lines = ["---"]
    lines.push(`title: "${title}"`)
    lines.push(`description: "${description || ""}"`)
    if (image) lines.push(`image: "${image}"`)
    lines.push(`publishedAt: ${publishedAt || new Date().toISOString().split("T")[0]}`)
    lines.push("author:")
    lines.push(`  name: ${authorName || "ColdEmailKit"}`)
    lines.push(`  image: "${authorImage || "/authors/default.jpg"}"`)
    lines.push(`  twitterHandle: "${authorTwitter || "@coldemailkit"}"`)

    if (tools?.length) {
      lines.push("tools:")
      for (const t of tools) {
        lines.push(`  - ${t}`)
      }
    }

    lines.push("---")
    const fullContent = `${lines.join("\n")}\n\n${content || ""}`

    // If slug changed, delete old file
    if (newSlug && newSlug !== slug) {
      await fs.unlink(currentPath).catch(() => {})
    }

    await fs.writeFile(newPath, fullContent, "utf-8")

    // Trigger ISR revalidation so the edit is reflected on the live site
    revalidatePath("/blog")
    revalidatePath(`/blog/${slug}`)
    if (newSlug && newSlug !== slug) {
      revalidatePath(`/blog/${newSlug}`)
    }

    return NextResponse.json({ success: true, slug: finalSlug })
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
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`)

    try {
      await fs.unlink(filePath)

      // Trigger ISR revalidation so the deletion is reflected on the live site
      revalidatePath("/blog")
      revalidatePath(`/blog/${slug}`)

      return NextResponse.json({ success: true, deleted: slug })
    } catch {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }
  })(req)
}
