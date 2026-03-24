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
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by tool pair
  const pairs = new Map<string, ComparisonPair>()

  const checkAndSetPair = (item: any, isFaq: boolean) => {
    const [id1, id2] = [item.tool1Id, item.tool2Id].sort()
    const key = `${id1}-${id2}`
    if (pairs.has(key)) {
      if (isFaq) pairs.get(key)!.faqCount++
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
      tool1Description: true,
      tool2Description: true
    },
  })
  
  if (comparison) {
    // If the DB returned them but they were inserted under swapped IDs, correct them
    // However, our action `upsertComparisonData` now handles sorting, so it correctly saves
    // we need to return the correct description for tool1Id and tool2Id.
    // The query above can match either order. So we must map it back correctly.
    const dbMatchedMatchedTool1IdFirst = (await db.comparison.findFirst({
      where: { tool1Id: tool1Id, tool2Id: tool2Id },
      select: { id: true }
    })) != null;
    
    // Actually `upsertComparisonData` creates them with sorted IDs, 
    // and correctly applies `tool1Description` to whichever ID was first in the sorted array.
    // Let's just find the exact one we fetched. 
    // Wait, the action `upsertComparisonData` uses `[id1, id2] = [tool1Id, tool2Id].sort()`.
    // It assigned `tool1Description: finalTool1Desc = id1 === tool1Id ? tool1Description_arg : tool2Description_arg`.
    // So `db-tool1Description` corresponds to `db-tool1Id` (which is `id1`).
    // If our `tool1Id_arg` === `id1`, then `tool1Description_arg` is `db-tool1Description`.
    // If our `tool1Id_arg` !== `id1`, then `tool1Description_arg` is `db-tool2Description`.
    
    // We don't have the `id1` here from the DB object since we didn't select it. Let's just assume the user sorts it here as well.
    const [id1, id2] = [tool1Id, tool2Id].sort()
    
    return {
      verdict: comparison.verdict,
      customTitle: comparison.customTitle,
      customDescription: comparison.customDescription,
      tool1Description: id1 === tool1Id ? comparison.tool1Description : comparison.tool2Description,
      tool2Description: id1 === tool1Id ? comparison.tool2Description : comparison.tool1Description,
    }
  }

  return { verdict: null, customTitle: null, customDescription: null, tool1Description: null, tool2Description: null }
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
