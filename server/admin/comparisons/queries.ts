import { db } from "~/services/db"

export type ComparisonPair = {
  id: string
  slug: string
  tool1Id: string
  tool2Id: string
  tool1: { id: string; name: string; slug: string; faviconUrl: string | null }
  tool2: { id: string; name: string; slug: string; faviconUrl: string | null }
  faqCount: number
  status: string
  createdAt: Date
}

export const findAllComparisonPairs = async (): Promise<ComparisonPair[]> => {
  // 1. Get all FAQ-based pairs
  const faqs = await db.comparisonFaq.findMany({
    select: {
      id: true,
      tool1Id: true,
      tool2Id: true,
      order: true,
      createdAt: true,
      tool1: { select: { id: true, name: true, slug: true, faviconUrl: true } },
      tool2: { select: { id: true, name: true, slug: true, faviconUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // 2. Add pairs from Comparison table (might overlap)
  const comparisons = await db.comparison.findMany({
    select: {
      id: true,
      tool1Id: true,
      tool2Id: true,
      createdAt: true,
      tool1: { select: { id: true, name: true, slug: true, faviconUrl: true } },
      tool2: { select: { id: true, name: true, slug: true, faviconUrl: true } },
      status: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by tool pair
  const pairs = new Map<string, ComparisonPair>()

  const checkAndSetPair = (item: any, isFaq: boolean) => {
    const [id1, id2] = [item.tool1Id, item.tool2Id].sort()
    const key = `${id1}-${id2}`
    if (pairs.has(key)) {
      const existing = pairs.get(key)!
      if (isFaq) {
        existing.faqCount++
      } else {
        existing.status = item.status
      }
    } else {
      const slug = `${item.tool1.slug}-vs-${item.tool2.slug}`
      pairs.set(key, {
        id: key,
        slug,
        tool1Id: item.tool1Id,
        tool2Id: item.tool2Id,
        tool1: item.tool1,
        tool2: item.tool2,
        faqCount: isFaq ? 1 : 0,
        status: isFaq ? "Draft" : item.status,
        createdAt: item.createdAt,
      })
    }
  }

  faqs.forEach(f => checkAndSetPair(f, true))
  comparisons.forEach(f => checkAndSetPair(f, false))

  return Array.from(pairs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Fetches comparison FAQs for a specific pair (admin CRUD)
 */
export const findPairFaqs = async (tool1Id: string, tool2Id: string) => {
  return db.comparisonFaq.findMany({
    where: {
      OR: [
        { tool1Id, tool2Id },
        { tool1Id: tool2Id, tool2Id: tool1Id },
      ],
    },
    orderBy: { order: "asc" },
  })
}

/**
 * Get the dedicated comparison data (verdict, custom SEO) for a comparison pair
 */
export const findComparisonData = async (tool1Id: string, tool2Id: string) => {
  const comparison = await db.comparison.findFirst({
    where: {
      OR: [
        { tool1Id, tool2Id },
        { tool1Id: tool2Id, tool2Id: tool1Id },
      ],
    },
    select: {
      verdict: true,
      customTitle: true,
      customDescription: true,
      overviewContent: true,
      tool1Description: true,
      tool2Description: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (comparison) {
    const [id1] = [tool1Id, tool2Id].sort()

    return {
      verdict: comparison.verdict,
      customTitle: comparison.customTitle,
      customDescription: comparison.customDescription,
      overviewContent: comparison.overviewContent,
      tool1Description: id1 === tool1Id ? comparison.tool1Description : comparison.tool2Description,
      tool2Description: id1 === tool1Id ? comparison.tool2Description : comparison.tool1Description,
      status: comparison.status,
      publishedAt: comparison.publishedAt,
      createdAt: comparison.createdAt,
      updatedAt: comparison.updatedAt,
    }
  }

  return {
    verdict: null,
    customTitle: null,
    customDescription: null,
    overviewContent: null,
    tool1Description: null,
    tool2Description: null,
    status: "Draft",
    publishedAt: null,
    createdAt: null,
    updatedAt: null,
  }
}

/**
 * Find all published tools (for admin tool picker dropdowns)
 */
export const findAllPublishedTools = async () => {
  const { ToolStatus } = await import("@prisma/client")
  return db.tool.findMany({
    where: { status: ToolStatus.Published },
    select: { id: true, name: true, slug: true, faviconUrl: true },
    orderBy: { name: "asc" },
  })
}
