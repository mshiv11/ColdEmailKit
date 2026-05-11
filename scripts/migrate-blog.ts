import { PrismaClient } from "@prisma/client"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import matter from "gray-matter"

const prisma = new PrismaClient()

async function main() {
  console.log("Migrating blog posts to Prisma...")
  
  const postsDir = path.join(process.cwd(), "content", "posts")
  
  try {
    const files = await fs.readdir(postsDir)
    
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue
      
      const slug = file.replace(/\.mdx?$/, "")
      const filePath = path.join(postsDir, file)
      const fileContent = await fs.readFile(filePath, "utf-8")
      
      const { data: frontmatter, content } = matter(fileContent)
      
      console.log(`Processing: ${slug}`)
      const publishedAt = new Date(frontmatter.publishedAt)
      
      const existingTools = await prisma.tool.findMany({
        where: { slug: { in: frontmatter.tools || [] } },
        select: { slug: true }
      })
      const validToolSlugs = existingTools.map(t => t.slug)

      await prisma.blogPost.upsert({
        where: { slug },
        update: {
          title: frontmatter.title,
          description: frontmatter.description || null,
          content: content,
          imageUrl: frontmatter.image || null,
          authorName: frontmatter.author?.name || "Admin",
          authorImage: frontmatter.author?.image || null,
          authorTwitter: frontmatter.author?.twitterHandle || null,
          publishedAt,
          ...(validToolSlugs.length ? { tools: { connect: validToolSlugs.map((t: string) => ({ slug: t })) } } : {})
        },
        create: {
          slug,
          title: frontmatter.title,
          description: frontmatter.description || null,
          content: content,
          imageUrl: frontmatter.image || null,
          authorName: frontmatter.author?.name || "Admin",
          authorImage: frontmatter.author?.image || null,
          authorTwitter: frontmatter.author?.twitterHandle || null,
          publishedAt,
          ...(validToolSlugs.length ? { tools: { connect: validToolSlugs.map((t: string) => ({ slug: t })) } } : {})
        }
      })
      
      console.log(`✅ Successfully migrated ${slug}`)
    }
  } catch (error) {
    console.error("Error migrating blog posts:", error)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log("Migration complete.")
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
