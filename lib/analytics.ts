import type { Logger } from "inngest/middleware/logger"
import { getPostHogQueryApi } from "~/services/posthog-api"
import { tryCatch } from "~/utils/helpers"

type HogQLResponse = {
  results: any[][]
  columns: string[]
}

/**
 * Execute a PostHog HogQL query with retry logic for transient errors.
 */
const executeHogQLQuery = async (hogql: string, retries = 2): Promise<HogQLResponse> => {
  const payload = {
    query: {
      kind: "HogQLQuery",
      query: hogql,
    },
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await tryCatch(getPostHogQueryApi().post(payload).json<HogQLResponse>())

    if (!error) {
      return data
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Retry on 503 (server busy) and timeout errors, but not on auth errors
    const isRetryable =
      errorMessage.includes("503") ||
      errorMessage.includes("busy") ||
      errorMessage.includes("execution time")

    if (isRetryable && attempt < retries) {
      // Exponential backoff: 1s, 2s
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      continue
    }

    throw error
  }

  throw new Error("PostHog query failed after retries")
}

/**
 * Get the page analytics for a given page and period.
 * Uses simple count() instead of count(DISTINCT person_id) for performance.
 * @param page - The page path to get the analytics for (e.g. "/my-tool")
 * @param period - The period in days to look back (default: 30)
 * @returns The page analytics (visitors, pageviews)
 */
const getPageAnalytics = async (page: string, period = 30) => {
  const { data, error } = await tryCatch(
    executeHogQLQuery(`
      SELECT count() AS pageviews
      FROM events
      WHERE event = '$pageview'
        AND properties.$pathname = '${page}'
        AND timestamp >= now() - interval ${period} day
    `),
  )

  if (error) {
    console.error("Analytics error:", error)
    return { visitors: 0, pageviews: 0 }
  }

  const row = data.results[0]
  const pageviews = row ? Number(row[0]) : 0

  return {
    visitors: pageviews, // Use pageviews as approximation for visitors
    pageviews,
  }
}

/**
 * Get the total analytics for a given period.
 * Uses simple count() for performance on PostHog free tier.
 * @param period - The period in days to look back (default: 30)
 * @returns The total analytics with daily breakdown
 */
export const getTotalAnalytics = async (period = 30) => {
  const { data, error } = await tryCatch(
    executeHogQLQuery(`
      SELECT
        toDate(timestamp) AS date,
        count() AS visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - interval ${period} day
      GROUP BY date
      ORDER BY date ASC
    `),
  )

  if (error) {
    console.error("Analytics error:", error)
    return { results: [], totalVisitors: 0, averageVisitors: 0 }
  }

  const results = data.results.map(row => ({
    date: String(row[0]),
    visitors: Number(row[1]),
  }))

  const totalVisitors = results.reduce((acc, curr) => acc + curr.visitors, 0)
  const averageVisitors = results.length > 0 ? totalVisitors / results.length : 0

  return { results, totalVisitors, averageVisitors }
}

type FetchAnalyticsInBatchesParams = {
  data: {
    id: string
    name: string
    slug: string
    pageviews?: number | null
  }[]
  pathPrefix: string
  logger: Logger
  batchSize?: number
  onSuccess: (id: string, data: { pageviews: number }) => Promise<void>
}

/**
 * Fetch analytics data in batches.
 * Uses a smaller batch size to avoid overwhelming PostHog's query engine.
 */
export const fetchAnalyticsInBatches = async ({
  data,
  pathPrefix,
  logger,
  onSuccess,
  batchSize = 3,
}: FetchAnalyticsInBatchesParams) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async entity => {
        const result = await tryCatch(getPageAnalytics(`${pathPrefix}${entity.slug}`))

        if (result.error) {
          logger.error(`Failed to fetch analytics data for ${entity.name}`, {
            error: result.error,
            slug: entity.slug,
          })
          return null
        }

        await onSuccess(entity.id, {
          pageviews: result.data.pageviews ?? entity.pageviews ?? 0,
        })
      }),
    )

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < data.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}
