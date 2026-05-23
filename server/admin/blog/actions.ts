"use server"

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { adminProcedure } from "~/lib/safe-actions"
import { db } from "~/services/db"

const POSTS_DIR = path.join(process.cwd(), "content/posts")
const REDIRECTS_FILE = path.join(process.cwd(), "content/blog-redirects.json")

type BlogRedirect = { from: string; to: string }

const blogPostSchema = z.object({
  oldSlug: z.string().optional(), // For detecting slug changes
  slug: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().optional(),
  publishedAt: z.string(),
  authorName: z.string(),
  authorImage: z.string(),
  authorTwitter: z.string(),
  tools: z.array(z.string()).optional(),
  content: z.string(),
})

export type BlogPostSchema = z.infer<typeof blogPostSchema>

export const readBlogPost = async (
  slug: string,
): Promise<{ frontmatter: Record<string, unknown>; content: string } | null> => {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
    const fileContent = await fs.readFile(filePath, "utf-8")

    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!frontmatterMatch) return null

    const frontmatterStr = frontmatterMatch[1]
    const content = fileContent.slice(frontmatterMatch[0].length).trim()

    // Simple YAML parsing (for our known structure)
    const frontmatter: Record<string, unknown> = {}
    let inAuthor = false
    const authorObj: Record<string, string> = {}
    const toolsArr: string[] = []
    let inTools = false

    for (const line of frontmatterStr.split(/\r?\n/)) {
      if (line.startsWith("author:")) {
        inAuthor = true
        inTools = false
        continue
      }
      if (line.startsWith("tools:")) {
        inTools = true
        inAuthor = false
        continue
      }

      if (inAuthor && line.startsWith("  ")) {
        const match = line.match(/^\s+(\w+):\s*["']?(.+?)["']?\s*$/)
        if (match) authorObj[match[1]] = match[2]
        continue
      }

      if (inTools && line.startsWith("  -")) {
        const tool = line.replace(/^\s+-\s*/, "").trim()
        toolsArr.push(tool)
        continue
      }

      // Regular key-value
      inAuthor = false
      inTools = false
      const match = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/)
      if (match) {
        frontmatter[match[1]] = match[2]
      }
    }

    if (Object.keys(authorObj).length) frontmatter.author = authorObj
    if (toolsArr.length) frontmatter.tools = toolsArr

    return { frontmatter, content }
  } catch {
    // Database fallback
    try {
      const post = await db.blogPost.findUnique({
        where: { slug },
        include: { tools: { select: { slug: true } } }
      })
      if (post) {
        return {
          frontmatter: {
            title: post.title,
            description: post.description || "",
            image: post.imageUrl || "",
            publishedAt: post.publishedAt.toISOString().split("T")[0],
            author: {
              name: post.authorName,
              image: post.authorImage || "",
              twitterHandle: post.authorTwitter || "",
            },
            tools: post.tools.map((t: { slug: string }) => t.slug),
          },
          content: post.content,
        }
      }
    } catch (dbErr) {
      console.error("Database fallback failed in readBlogPost:", dbErr)
    }
    return null
  }
}

export const updateBlogPost = adminProcedure
  .createServerAction()
  .input(blogPostSchema)
  .handler(async ({ input }) => {
    const filePath = path.join(POSTS_DIR, `${input.slug}.mdx`)

    // Handle slug change - delete old file and create redirect
    if (input.oldSlug && input.oldSlug !== input.slug) {
      const oldFilePath = path.join(POSTS_DIR, `${input.oldSlug}.mdx`)

      // Delete old file (ignore errors if file doesn't exist)
      await fs.unlink(oldFilePath).catch(() => {})

      // Add redirect to JSON file
      try {
        const redirectsContent = await fs.readFile(REDIRECTS_FILE, "utf-8").catch(() => "[]")
        const redirects: BlogRedirect[] = JSON.parse(redirectsContent)

        // Remove any existing redirect for the old slug (to avoid duplicates)
        const filteredRedirects = redirects.filter(r => r.from !== input.oldSlug)
        filteredRedirects.push({ from: input.oldSlug, to: input.slug })

        await fs.writeFile(REDIRECTS_FILE, JSON.stringify(filteredRedirects, null, 2), "utf-8")
      } catch (err) {
        console.error("Failed to update redirects:", err)
      }

      // Also revalidate old path
      revalidatePath(`/blog/${input.oldSlug}`)
    }

    // Build frontmatter
    const frontmatter = `---
title: "${input.title}"
description: "${input.description}"
${input.image ? `image: "${input.image}"` : ""}
publishedAt: ${input.publishedAt}
author:
  name: ${input.authorName}
  image: "${input.authorImage}"
  twitterHandle: "${input.authorTwitter}"
${input.tools?.length ? `tools:\n${input.tools.map((t: string) => `  - ${t}`).join("\n")}` : ""}
---

${input.content}`.trim()

    // Write to disk
    await fs.writeFile(filePath, frontmatter, "utf-8").catch((err) => {
      console.warn("Failed to write mdx file to disk (might be serverless):", err)
    })

    // Connect only valid tools
    let validToolSlugs: string[] = []
    if (input.tools && Array.isArray(input.tools) && input.tools.length > 0) {
      const existingTools = await db.tool.findMany({
        where: { slug: { in: input.tools } },
        select: { slug: true }
      })
      validToolSlugs = existingTools.map((t: { slug: string }) => t.slug)
    }

    // Update in database
    await db.blogPost.upsert({
      where: { slug: input.oldSlug || input.slug },
      update: {
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        imageUrl: input.image || null,
        content: input.content,
        publishedAt: new Date(input.publishedAt),
        authorName: input.authorName,
        authorImage: input.authorImage || null,
        authorTwitter: input.authorTwitter || null,
        tools: {
          set: [],
          connect: validToolSlugs.map((t: string) => ({ slug: t }))
        }
      },
      create: {
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        imageUrl: input.image || null,
        content: input.content,
        publishedAt: new Date(input.publishedAt),
        authorName: input.authorName,
        authorImage: input.authorImage || null,
        authorTwitter: input.authorTwitter || null,
        tools: {
          connect: validToolSlugs.map((t: string) => ({ slug: t }))
        }
      }
    })

    revalidatePath("/admin/blog")
    revalidatePath("/blog")
    revalidatePath(`/blog/${input.slug}`)

    return { success: true, slug: input.slug }
  })

export const createBlogPost = adminProcedure
  .createServerAction()
  .input(blogPostSchema)
  .handler(async ({ input }) => {
    const filePath = path.join(POSTS_DIR, `${input.slug}.mdx`)

    // Check if file exists
    try {
      await fs.access(filePath)
      throw new Error("A post with this slug already exists")
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
    }

    // Check database if post already exists
    const existing = await db.blogPost.findUnique({ where: { slug: input.slug } })
    if (existing) {
      throw new Error("A post with this slug already exists in the database")
    }

    // Build frontmatter
    const frontmatter = `---
title: "${input.title}"
description: "${input.description}"
${input.image ? `image: "${input.image}"` : ""}
publishedAt: ${input.publishedAt}
author:
  name: ${input.authorName}
  image: "${input.authorImage}"
  twitterHandle: "${input.authorTwitter}"
${input.tools?.length ? `tools:\n${input.tools.map((t: string) => `  - ${t}`).join("\n")}` : ""}
---

${input.content}`.trim()

    // Write to disk
    await fs.writeFile(filePath, frontmatter, "utf-8").catch((err) => {
      console.warn("Failed to write mdx file to disk:", err)
    })

    // Connect only valid tools
    let validToolSlugs: string[] = []
    if (input.tools && Array.isArray(input.tools) && input.tools.length > 0) {
      const existingTools = await db.tool.findMany({
        where: { slug: { in: input.tools } },
        select: { slug: true }
      })
      validToolSlugs = existingTools.map((t: { slug: string }) => t.slug)
    }

    // Create in database
    await db.blogPost.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        imageUrl: input.image || null,
        content: input.content,
        publishedAt: new Date(input.publishedAt),
        authorName: input.authorName,
        authorImage: input.authorImage || null,
        authorTwitter: input.authorTwitter || null,
        ...(validToolSlugs.length > 0 && {
          tools: {
            connect: validToolSlugs.map((t: string) => ({ slug: t }))
          }
        })
      }
    })

    revalidatePath("/admin/blog")
    revalidatePath("/blog")

    return { success: true, slug: input.slug }
  })

export const deleteBlogPost = adminProcedure
  .createServerAction()
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const filePath = path.join(POSTS_DIR, `${input.slug}.mdx`)
    await fs.unlink(filePath).catch(() => {})

    // Delete in database
    await db.blogPost.delete({ where: { slug: input.slug } }).catch(() => {})

    revalidatePath("/admin/blog")
    revalidatePath("/blog")

    return { success: true }
  })
