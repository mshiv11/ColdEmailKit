import type { Review } from "@prisma/client"
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { getSortingStateParser } from "~/lib/parsers"

export const reviewsTableParamsSchema = {
  comment: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  sort: getSortingStateParser<Review>().withDefault([{ id: "createdAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const reviewsTableParamsCache = createSearchParamsCache(reviewsTableParamsSchema)
export type ReviewsTableSchema = Awaited<ReturnType<typeof reviewsTableParamsCache.parse>>
