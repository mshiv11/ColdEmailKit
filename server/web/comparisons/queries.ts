import { ToolStatus } from "@prisma/client"
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache"
import { comparisonToolPayload, comparisonFaqPayload } from "~/server/web/comparisons/payloads"
import { db } from "~/services/db"

/**
 * Fetches two tools by slug for comparison.
 * Returns null if either tool is not found or not published.
 */
export const findComparisonTools = async (slug1: string, slug2: string) => {
  "use cache"

  cacheTag(`comparison-${slug1}-${slug2}`)
  cacheLife("max")

  const [tool1, tool2] = await db.$transaction([
    db.tool.findFirst({
      where: { slug: slug1, status: ToolStatus.Published },
      select: comparisonToolPayload,
    }),
    db.tool.findFirst({
      where: { slug: slug2, status: ToolStatus.Published },
      select: comparisonToolPayload,
    }),
  ])

  if (!tool1 || !tool2) return null

  return [tool1, tool2] as const
}

/**
 * Fetches comparison FAQs for a tool pair (by ID), ordered by `order` asc.
 * Checks both orderings (tool1/tool2 and tool2/tool1) so the page works
 * regardless of which tool was stored as tool1 or tool2.
 */
export const findComparisonFaqs = async (toolId1: string, toolId2: string) => {
  "use cache"

  cacheTag(`comparison-faqs-${toolId1}-${toolId2}`)
  cacheLife("max")

  return db.comparisonFaq.findMany({
    where: {
      OR: [
        { tool1Id: toolId1, tool2Id: toolId2 },
        { tool1Id: toolId2, tool2Id: toolId1 },
      ],
    },
    select: comparisonFaqPayload,
    orderBy: { order: "asc" },
  })
}
