import { ToolStatus, ComparisonStatus } from "@prisma/client"
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

/**
 * Finds all other comparison pairs where either tool1 or tool2 appears,
 * excluding the current comparison. Used for "Related Comparisons" section.
 */
/**
 * Finds all comparisons where a specific tool appears as tool1 or tool2.
 * Used to render the "Compare [Tool]" section on individual tool pages.
 */
export const findComparisonsForTool = async (toolId: string) => {
  "use cache"

  cacheTag(`tool-comparisons-${toolId}`)
  cacheLife("max")

  const comparisons = await db.comparison.findMany({
    where: {
      status: ComparisonStatus.Published,
      OR: [{ tool1Id: toolId }, { tool2Id: toolId }],
    },
    select: {
      id: true,
      tool1: { select: { name: true, slug: true, faviconUrl: true } },
      tool2: { select: { name: true, slug: true, faviconUrl: true } },
    },
    take: 6,
  })

  return comparisons.map(c => ({
    slug: `${c.tool1.slug}-vs-${c.tool2.slug}`,
    tool1: c.tool1,
    tool2: c.tool2,
  }))
}

export const findRelatedComparisons = async (
  tool1Id: string,
  tool2Id: string,
  currentSlug: string,
) => {
  "use cache"

  cacheTag(`related-comparisons-${tool1Id}-${tool2Id}`)
  cacheLife("max")

  const relatedComparisons = await db.comparison.findMany({
    where: {
      status: ComparisonStatus.Published,
      OR: [{ tool1Id: { in: [tool1Id, tool2Id] } }, { tool2Id: { in: [tool1Id, tool2Id] } }],
    },
    select: {
      tool1Id: true,
      tool2Id: true,
      tool1: { select: { name: true, slug: true, faviconUrl: true } },
      tool2: { select: { name: true, slug: true, faviconUrl: true } },
    },
    take: 12,
  })

  // Group by pair and deduplicate
  const pairs = new Map<
    string,
    {
      slug: string
      tool1: { name: string; slug: string; faviconUrl: string | null }
      tool2: { name: string; slug: string; faviconUrl: string | null }
    }
  >()

  for (const comp of relatedComparisons) {
    const key = [comp.tool1Id, comp.tool2Id].sort().join("-")
    const slug = `${comp.tool1.slug}-vs-${comp.tool2.slug}`

    // Skip the current comparison
    if (slug === currentSlug) continue

    if (!pairs.has(key)) {
      pairs.set(key, {
        slug,
        tool1: comp.tool1,
        tool2: comp.tool2,
      })
    }
  }

  return Array.from(pairs.values())
}
