import type { Logger } from "inngest/middleware/logger"
import { getPostHogQueryApi } from "~/services/posthog-api"
import { tryCatch } from "~/utils/helpers"

type HogQLResponse = {
  results: any[][]
  columns: string[]
}

/**
 * Get the page analytics for a given page and period
 * @param page - The page path to get the analytics for (e.g. "/my-tool")
 * @param period - The period in days to look back (default: 30)
 * @returns The page analytics (visitors, pageviews)
 */
const getPageAnalytics = async (page: string, period = 30) => {
  const query = {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT
          count(DISTINCT person_id) AS visitors,
          count() AS pageviews
        FROM events
        WHERE event = '$pageview'
          AND properties.$pathname = '${page}'
          AND timestamp >= now() - interval ${period} day
      `,
    },
  }

  const { data, error } = await tryCatch(
    getPostHogQueryApi().post(query).json<HogQLResponse>(),
  )

  if (error) {
    console.error("Analytics error:", error)
    return { visitors: 0, pageviews: 0 }
  }

  // HogQL returns results as arrays: [[visitors, pageviews]]
  const row = data.results[0]
  return {
    visitors: row ? Number(row[0]) : 0,
    pageviews: row ? Number(row[1]) : 0,
  }
}

/**
 * Get the total analytics for a given period
 * @param period - The period in days to look back (default: 30)
 * @returns The total analytics with daily breakdown
 */
export const getTotalAnalytics = async (period = 30) => {
  const query = {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT
          toDate(timestamp) AS date,
          count(DISTINCT person_id) AS visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval ${period} day
        GROUP BY date
        ORDER BY date ASC
      `,
    },
  }

  const { data, error } = await tryCatch(
    getPostHogQueryApi().post(query).json<HogQLResponse>(),
  )

  if (error) {
    console.error("Analytics error:", error)
    return { results: [], totalVisitors: 0, averageVisitors: 0 }
  }

  const results = data.results.map((row) => ({
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
 * Fetch analytics data in batches
 * @param params - The parameters for the fetch
 */
export const fetchAnalyticsInBatches = async ({
  data,
  pathPrefix,
  logger,
  onSuccess,
  batchSize = 5,
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
  }
}
