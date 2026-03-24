import { Prisma } from "@prisma/client"

/**
 * Payload for a tool within a comparison - includes all feature fields
 */
export const comparisonToolPayload = Prisma.validator<Prisma.ToolSelect>()({
  id: true,
  name: true,
  slug: true,
  websiteUrl: true,
  affiliateUrl: true,
  faviconUrl: true,
  screenshotUrl: true,
  description: true,
  overallRating: true,
  totalReviews: true,
  trustScore: true,
  isFeatured: true,
  pricingStarting: true,
  ownerId: true,
  bestFor: true,
  lastCommitDate: true,
  firstCommitDate: true,
  isSelfHosted: true,
  license: true,
  g2Rating: true,
  g2Reviews: true,
  trustpilotRating: true,
  trustpilotReviews: true,
  capterraRating: true,
  capterraReviews: true,
  trustradiusRating: true,
  trustradiusReviews: true,
  coldEmailKitRating: true,
  coldEmailKitReviews: true,
  // All feature JSON fields
  specifications: true,
  pricingSpecs: true,
  inboxFeatures: true,
  warmupFeatures: true,
  leadsFeatures: true,
  enrichmentFeatures: true,
  copywritingFeatures: true,
  outreachFeatures: true,
  deliverabilityFeatures: true,
  linkedinFeatures: true,
})

/**
 * Payload for a comparison FAQ entry
 */
export const comparisonFaqPayload = Prisma.validator<Prisma.ComparisonFaqSelect>()({
  id: true,
  tool1Id: true,
  tool2Id: true,
  question: true,
  answer: true,
  order: true,
})

export type ComparisonTool = Prisma.ToolGetPayload<{ select: typeof comparisonToolPayload }>
export type ComparisonFaqItem = Prisma.ComparisonFaqGetPayload<{
  select: typeof comparisonFaqPayload
}>
