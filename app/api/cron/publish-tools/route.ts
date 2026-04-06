import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "~/services/db"
import { executePublishSideEffects } from "~/server/admin/tools/publish"
import { ToolStatus } from "@prisma/client"

export const maxDuration = 300 // 5 minutes

// Verify Vercel cron secret to prevent unauthorized access
async function verifyCronSecret(req: Request): Promise<boolean> {
  const headersList = await headers()
  const cronSecret = headersList.get("authorization")
  const expectedSecret = process.env.CRON_SECRET

  // If CRON_SECRET is not set, reject all requests in production
  if (!expectedSecret) {
    console.warn("CRON_SECRET not configured")
    return process.env.NODE_ENV !== "production"
  }

  return cronSecret === `Bearer ${expectedSecret}`
}

export async function GET(req: Request) {
  // Verify the request is from Vercel/Railway Cron
  if (!(await verifyCronSecret(req))) {
    console.error("Unauthorized cron request attempted")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Determine the current time on a 5-minute increment boundary for robustness
    const now = new Date()
    
    // Find tools scheduled to be published that are at or past their publish time
    const toolsToPublish = await db.tool.findMany({
      where: {
        status: ToolStatus.Scheduled,
        publishedAt: { lte: now }
      },
      select: {
        id: true,
        name: true
      }
    })

    if (toolsToPublish.length === 0) {
      return NextResponse.json({ message: "No tools to publish" })
    }

    const results = []

    for (const tool of toolsToPublish) {
      try {
        console.log(`Publishing scheduled tool: ${tool.name}`)

        // 1. Update status
        await db.tool.update({
          where: { id: tool.id },
          data: {
            status: ToolStatus.Published,
          },
        })

        // 2. Perform side effects (notifications, meilisearch, social posting, indexnow)
        await executePublishSideEffects(tool.id, true)

        results.push({ tool: tool.name, status: "published" })
      } catch (error) {
        console.error(`Error publishing tool ${tool.name}:`, error)
        results.push({ tool: tool.name, status: "failed", error: (error as Error).message })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Publish cron job error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
