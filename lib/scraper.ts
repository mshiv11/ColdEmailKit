import wretch from "wretch"
import { env } from "~/env"
import { getErrorMessage } from "~/lib/handle-error"
import { tryCatch } from "~/utils/helpers"

export type ScrapedWebsiteData = {
  title: string
  description: string
  url: string
  content: string
}

type JinaResponse = {
  data: ScrapedWebsiteData
}

/**
 * Scrapes a website and returns the scraped data using Jina.ai's Reader API.
 * The Reader API expects the URL to be appended to the path: https://r.jina.ai/<url>
 * @param url The URL of the website to scrape.
 * @returns The scraped data.
 */
export const scrapeWebsiteData = async (url: string) => {
  // Jina Reader API: append target URL to the path
  let jinaApi = wretch(`https://r.jina.ai/${url}`).headers({
    Accept: "application/json",
    "X-Return-Format": "markdown",
  })

  if (env.JINA_API_KEY) {
    jinaApi = jinaApi.auth(`Bearer ${env.JINA_API_KEY}`)
  }

  const { data, error } = await tryCatch(jinaApi.get().json<JinaResponse>())

  if (error) {
    console.error("Jina API error:", error)
    throw new Error(getErrorMessage(error))
  }

  return data.data
}

type FirecrawlResponse = {
  success?: boolean
  markdown?: string
  data?: {
    markdown?: string
    content?: string
    title?: string
    description?: string
    metadata?: {
      title?: string
      description?: string
      sourceURL?: string
      url?: string
    }
  }
}

const normalizeFirecrawlResponse = (url: string, data: FirecrawlResponse): ScrapedWebsiteData => {
  const normalized = data.data ?? {}
  const metadata = normalized.metadata ?? {}
  const content = normalized.markdown ?? normalized.content ?? data.markdown

  if (!content) {
    throw new Error("Firecrawl returned no scrape content.")
  }

  return {
    title: normalized.title ?? metadata.title ?? "",
    description: normalized.description ?? metadata.description ?? "",
    url: metadata.sourceURL ?? metadata.url ?? url,
    content,
  }
}

export const scrapeWebsiteDataWithFirecrawl = async (url: string) => {
  if (!env.FIRECRAWL_API_KEY) {
    throw new Error("Firecrawl fallback is not configured. Add FIRECRAWL_API_KEY to your environment.")
  }

  console.log("Scraping with Firecrawl:", url)

  const firecrawlApi = wretch("https://api.firecrawl.dev/v1/scrape")
    .auth(`Bearer ${env.FIRECRAWL_API_KEY}`)
    .headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    })

  const { data, error } = await tryCatch(
    firecrawlApi
      .post({
        url,
        formats: ["markdown"],
      })
      .json<FirecrawlResponse>(),
  )

  if (error) {
    console.error("Firecrawl API error:", error)
    throw new Error(getErrorMessage(error))
  }

  return normalizeFirecrawlResponse(url, data)
}

export const scrapeWebsiteDataWithFallback = async (url: string) => {
  try {
    const result = await scrapeWebsiteData(url)
    console.log("Scraped successfully with Jina Reader")
    return result
  } catch (jinaError) {
    console.error("Jina Reader error (trying Firecrawl fallback):", jinaError)
  }

  return scrapeWebsiteDataWithFirecrawl(url)
}

type JinaSearchResult = {
  title: string
  description: string
  url: string
  content: string
}

type JinaSearchResponse = {
  data: JinaSearchResult[]
}

/**
 * Firecrawl Search API response types.
 * Endpoint: POST https://api.firecrawl.dev/v2/search
 */
type FirecrawlSearchResult = {
  url: string
  title: string
  description: string
  markdown?: string
  metadata?: {
    title?: string
    description?: string
    sourceURL?: string
  }
}

type FirecrawlSearchResponse = {
  success: boolean
  data:
    | FirecrawlSearchResult[]
    | {
        web?: FirecrawlSearchResult[]
      }
}

/**
 * Searches the web using Firecrawl's Search API (v2).
 * Used as fallback when Jina Search is depleted.
 * @param query The search query string.
 * @returns Formatted markdown string of top search results, or empty string on failure.
 */
export const searchWebDataWithFirecrawl = async (query: string): Promise<string> => {
  if (!env.FIRECRAWL_API_KEY) {
    console.error("Firecrawl Search fallback skipped: FIRECRAWL_API_KEY not configured.")
    return ""
  }

  console.log("Searching with Firecrawl:", query)

  const firecrawlApi = wretch("https://api.firecrawl.dev/v2/search")
    .auth(`Bearer ${env.FIRECRAWL_API_KEY}`)
    .headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    })

  const { data, error } = await tryCatch(
    firecrawlApi
      .post({
        query,
        limit: 5,
        scrapeOptions: {
          formats: ["markdown"],
        },
      })
      .json<FirecrawlSearchResponse>(),
  )

  if (error) {
    console.error("Firecrawl Search API error:", error)
    return ""
  }

  // Handle both response formats: array or { web: [] }
  const results = Array.isArray(data.data) ? data.data : data.data?.web ?? []

  if (results.length === 0) {
    console.warn("Firecrawl Search returned no results for:", query)
    return ""
  }

  return results
    .slice(0, 5)
    .map(r => {
      const content = r.markdown || r.description || ""
      return `### ${r.title}\n${r.description}\n${content}`
    })
    .join("\n\n")
}

/**
 * Searches the web for information about a tool.
 * Tries Jina Search first, falls back to Firecrawl Search if Jina fails.
 * @param query The search query string.
 * @returns Formatted markdown string of top search results, or empty string on failure.
 */
export const searchWebData = async (query: string): Promise<string> => {
  // Try Jina Search first
  let jinaApi = wretch(`https://s.jina.ai/${encodeURIComponent(query)}`).headers({
    Accept: "application/json",
  })

  if (env.JINA_API_KEY) {
    jinaApi = jinaApi.auth(`Bearer ${env.JINA_API_KEY}`)
  }

  const { data, error } = await tryCatch(jinaApi.get().json<JinaSearchResponse>())

  if (!error && data?.data?.length > 0) {
    console.log("Searched successfully with Jina")
    return data.data
      .slice(0, 5)
      .map(r => `### ${r.title}\n${r.description}\n${r.content}`)
      .join("\n\n")
  }

  // Jina failed or returned empty — fall back to Firecrawl Search
  if (error) {
    console.error("Jina Search failed (trying Firecrawl Search fallback):", error)
  } else {
    console.warn("Jina Search returned empty results, trying Firecrawl Search")
  }

  return searchWebDataWithFirecrawl(query)
}
