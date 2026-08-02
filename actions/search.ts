"use server"

import { ComparisonStatus, ToolStatus } from "@prisma/client"
import { z } from "zod"
import { createServerAction } from "zsa"
import { db } from "~/services/db"
import { tryCatch } from "~/utils/helpers"

export type ToolSearchResult = {
  slug: string
  name: string
  websiteUrl: string
  faviconUrl?: string
}

export type AlternativeSearchResult = {
  slug: string
  name: string
  faviconUrl?: string
}

export type CategorySearchResult = {
  slug: string
  name: string
  fullPath: string
}

export type ComparisonSearchResult = {
  slug: string
  name: string
}

export type BlogSearchResult = {
  slug: string
  name: string
}

export type SearchCategoryResult<T> = {
  hits: T[]
  estimatedTotalHits: number
  processingTimeMs: number
}

export type SearchResultsTuple = [
  SearchCategoryResult<ToolSearchResult>,
  SearchCategoryResult<AlternativeSearchResult>,
  SearchCategoryResult<CategorySearchResult>,
  SearchCategoryResult<ComparisonSearchResult>,
  SearchCategoryResult<BlogSearchResult>,
]

export const searchItems = createServerAction()
  .input(z.object({ query: z.string().trim() }))
  .handler(async ({ input: { query } }): Promise<SearchResultsTuple> => {
    const start = performance.now()

    if (!query) {
      return [
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
      ]
    }

    const { data, error } = await tryCatch(
      Promise.all([
        // 1. Tools
        (async (): Promise<SearchCategoryResult<ToolSearchResult>> => {
          const tStart = performance.now()
          const tools = await db.tool.findMany({
            where: {
              status: ToolStatus.Published,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { tagline: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              slug: true,
              name: true,
              websiteUrl: true,
              faviconUrl: true,
            },
            orderBy: [{ isFeatured: "desc" }, { score: "desc" }],
            take: 10,
          })
          return {
            hits: tools.map(t => ({
              slug: t.slug,
              name: t.name,
              websiteUrl: t.websiteUrl,
              faviconUrl: t.faviconUrl ?? undefined,
            })),
            estimatedTotalHits: tools.length,
            processingTimeMs: Math.round(performance.now() - tStart),
          }
        })(),

        // 2. Alternatives
        (async (): Promise<SearchCategoryResult<AlternativeSearchResult>> => {
          const aStart = performance.now()
          const alternatives = await db.alternative.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              slug: true,
              name: true,
              faviconUrl: true,
            },
            orderBy: { pageviews: "desc" },
            take: 10,
          })
          return {
            hits: alternatives.map(a => ({
              slug: a.slug,
              name: a.name,
              faviconUrl: a.faviconUrl ?? undefined,
            })),
            estimatedTotalHits: alternatives.length,
            processingTimeMs: Math.round(performance.now() - aStart),
          }
        })(),

        // 3. Categories
        (async (): Promise<SearchCategoryResult<CategorySearchResult>> => {
          const cStart = performance.now()
          const categories = await db.category.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              slug: true,
              name: true,
              fullPath: true,
            },
            take: 10,
          })
          return {
            hits: categories.map(c => ({
              slug: c.slug,
              name: c.name,
              fullPath: c.fullPath,
            })),
            estimatedTotalHits: categories.length,
            processingTimeMs: Math.round(performance.now() - cStart),
          }
        })(),

        // 4. Comparisons
        (async (): Promise<SearchCategoryResult<ComparisonSearchResult>> => {
          const compStart = performance.now()
          const comparisons = await db.comparison.findMany({
            where: {
              status: ComparisonStatus.Published,
              OR: [
                { customTitle: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { tool1: { name: { contains: query, mode: "insensitive" } } },
                { tool2: { name: { contains: query, mode: "insensitive" } } },
              ],
            },
            select: {
              slug: true,
              customTitle: true,
              tool1: { select: { name: true, slug: true } },
              tool2: { select: { name: true, slug: true } },
            },
            take: 10,
          })
          const hits = comparisons.map(c => ({
            slug: c.slug || `${c.tool1.slug}-vs-${c.tool2.slug}`,
            name: c.customTitle || `${c.tool1.name} vs ${c.tool2.name}`,
          }))
          return {
            hits,
            estimatedTotalHits: hits.length,
            processingTimeMs: Math.round(performance.now() - compStart),
          }
        })(),

        // 5. Blog Posts
        (async (): Promise<SearchCategoryResult<BlogSearchResult>> => {
          const bStart = performance.now()
          const posts = await db.blogPost.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              slug: true,
              title: true,
            },
            take: 10,
          })
          return {
            hits: posts.map(p => ({ slug: p.slug, name: p.title })),
            estimatedTotalHits: posts.length,
            processingTimeMs: Math.round(performance.now() - bStart),
          }
        })(),
      ]),
    )

    console.log(`Search total time: ${Math.round(performance.now() - start)}ms`)

    if (error || !data) {
      console.error(error)
      return [
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
        { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 },
      ]
    }

    return data
  })


