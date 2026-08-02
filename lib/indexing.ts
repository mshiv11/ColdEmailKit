import { type Prisma } from "@prisma/client"

/**
 * Direct database search is used instead of external Meilisearch indexing.
 * Functions preserved as no-ops for backwards compatibility.
 */
export const indexTools = async (_opts?: { where?: Prisma.ToolWhereInput }) => {
  return null
}

export const indexAlternatives = async (_opts?: { where?: Prisma.AlternativeWhereInput }) => {
  return null
}

export const indexCategories = async (_opts?: { where?: Prisma.CategoryWhereInput }) => {
  return null
}

export const indexComparisons = async () => {
  return null
}

export const indexBlogPosts = async () => {
  return null
}

