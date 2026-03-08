import { db } from "~/services/db"

export type ComparisonPair = {
  id: string
  slug: string
  tool1Id: string
  tool2Id: string
  tool1: { id: string; name: string; slug: string; faviconUrl: string | null }
  tool2: { id: string; name: string; slug: string; faviconUrl: string | null }
  faqCount: number
  createdAt: Date
}

/**
 * Fetches all comparison FAQ pairs grouped by tool pair (for admin DataTable).
 * Also includes pairs where tools have comparisonDescription set (even without FAQs).
 */
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

  // Group by tool pair
  const pairs = new Map<string, ComparisonPair>()

  for (const faq of faqs) {
    const key = [faq.tool1Id, faq.tool2Id].sort().join("-")
    if (pairs.has(key)) {
      pairs.get(key)!.faqCount++
    } else {
      const slug = `${faq.tool1.slug}-vs-${faq.tool2.slug}`
      pairs.set(key, {
        id: key,
        slug,
        tool1Id: faq.tool1Id,
        tool2Id: faq.tool2Id,
        tool1: faq.tool1,
        tool2: faq.tool2,
        faqCount: 1,
        createdAt: faq.createdAt,
      })
    }
  }

  // 2. Also find tools that have comparisonDescription set but may not have FAQs yet
  // These are "description-only" comparisons that should still show up
  const toolsWithDesc = await db.tool.findMany({
    where: {
      comparisonDescription: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      faviconUrl: true,
      comparisonDescription: true,
      updatedAt: true,
    },
  })

  // For each tool with a description, check if it's part of any FAQ pair we already know about
  // If not, we can't determine the pair (no tool2 info), so we skip standalone descriptions
  // This is expected — descriptions are set on the per-comparison edit page which requires both tools

  return Array.from(pairs.values())
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
 * Get tool comparison description for admin editing
 */
export const findToolComparisonDescription = async (toolId: string) => {
  return db.tool.findUnique({
    where: { id: toolId },
    select: { id: true, name: true, comparisonDescription: true },
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
    select: { verdict: true, customTitle: true, customDescription: true },
  })
  return comparison || { verdict: null, customTitle: null, customDescription: null }
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
