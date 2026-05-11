import { ToolStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { siteConfig } from "~/config/site"
import { getToolSuffix } from "~/lib/tools"
import { toolAlternativesPayload } from "~/server/web/tools/payloads"
import { db } from "~/services/db"

export const GET = async () => {
  const tools = await db.tool.findMany({
    where: { status: ToolStatus.Published },
    orderBy: { pageviews: "desc" },
    select: { name: true, slug: true, tagline: true, alternatives: toolAlternativesPayload },
  })

  const blogPosts = await db.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true },
  })

  let content = `# ${siteConfig.name} - ${siteConfig.tagline}
${siteConfig.description}\n
## Blog Highlights
Links to our most popular blog posts.\n
${blogPosts.map(post => `- [${post.title}](${siteConfig.url}/blog/${post.slug})`).join("\n")}\n
## Cold Email Tools\n`

  for (const tool of tools) {
    content += `- [${tool.name}](${siteConfig.url}/${tool.slug}): ${getToolSuffix(tool)}\n`
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    },
  })
}
