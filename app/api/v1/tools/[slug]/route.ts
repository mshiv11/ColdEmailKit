import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiKeyAuth } from "~/lib/auth-hoc"
import { db } from "~/services/db"

/**
 * GET /api/v1/tools/[slug] — Get a single tool by slug.
 * Requires: tools:read scope
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  return withApiKeyAuth(["tools:read"], async () => {
    const { slug } = await params

    const tool = await db.tool.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        affiliateUrl: true,
        repositoryUrl: true,
        tagline: true,
        description: true,
        content: true,
        stars: true,
        forks: true,
        faviconUrl: true,
        screenshotUrl: true,
        isFeatured: true,
        isSelfHosted: true,
        overallRating: true,
        totalReviews: true,
        trustScore: true,
        pricingStarting: true,
        bestFor: true,
        discountCode: true,
        discountAmount: true,
        firstCommitDate: true,
        lastCommitDate: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
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
        g2Rating: true,
        g2Reviews: true,
        trustpilotRating: true,
        trustpilotReviews: true,
        capterraRating: true,
        capterraReviews: true,
        categories: {
          select: { name: true, slug: true },
        },
        alternatives: {
          select: { name: true, slug: true },
          orderBy: [{ pageviews: "desc" }],
        },
        integrations: {
          select: { name: true, slug: true },
        },
        license: true,
      },
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    return NextResponse.json({ tool })
  })(req)
}
