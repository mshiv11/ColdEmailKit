import wretch from "wretch"
import { env } from "~/env"
import { getErrorMessage } from "~/lib/handle-error"
import { tryCatch } from "~/utils/helpers"

type JinaResponse = {
  data: {
    title: string
    description: string
    url: string
    content: string
  }
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
 * Searches the web for information about a tool using Jina.ai's Search API.
 * The Search API expects the query to be appended to the path: https://s.jina.ai/<query>
 * @param query The search query string.
 * @returns Formatted markdown string of top search results, or empty string on failure.
 */
export const searchWebData = async (query: string): Promise<string> => {
  let jinaApi = wretch(`https://s.jina.ai/${encodeURIComponent(query)}`).headers({
    Accept: "application/json",
  })

  if (env.JINA_API_KEY) {
    jinaApi = jinaApi.auth(`Bearer ${env.JINA_API_KEY}`)
  }

  const { data, error } = await tryCatch(jinaApi.get().json<JinaSearchResponse>())

  if (error) {
    console.error("Jina Search API error:", error)
    return ""
  }

  return data.data
    .slice(0, 5)
    .map(r => `### ${r.title}\n${r.description}\n${r.content}`)
    .join("\n\n")
}
