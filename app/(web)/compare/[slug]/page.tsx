import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { ComparisonFaqs } from "~/components/web/compare/comparison-faqs"

import { ComparisonToolCard } from "~/components/web/compare/comparison-tool-card"
import { ComparisonTable } from "~/components/web/compare/comparison-table"
import { ExternalLink } from "~/components/web/external-link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { metadataConfig } from "~/config/metadata"
import { generateBreadcrumbSchema, jsonLdScriptProps, wrapInGraph } from "~/lib/schemas"
import { findComparisonFaqs, findComparisonTools } from "~/server/web/comparisons/queries"

export const revalidate = 604800

type PageProps = {
  params: Promise<{ slug: string }>
}

/**
 * Parse a comparison slug like "tool1-vs-tool2" into [slug1, slug2].
 * Returns null if the format is invalid.
 */
function parseComparisonSlug(slug: string): [string, string] | null {
  const vsIndex = slug.indexOf("-vs-")
  if (vsIndex === -1) return null

  const slug1 = slug.slice(0, vsIndex)
  const slug2 = slug.slice(vsIndex + 4) // "-vs-".length === 4

  if (!slug1 || !slug2) return null

  return [slug1, slug2]
}

const getTools = cache(async (slug: string) => {
  const parsed = parseComparisonSlug(slug)
  if (!parsed) notFound()

  const [slug1, slug2] = parsed
  const tools = await findComparisonTools(slug1, slug2)
  if (!tools) notFound()

  return tools
})

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params
  const parsed = parseComparisonSlug(slug)
  if (!parsed) return {}

  const tools = await findComparisonTools(parsed[0], parsed[1])
  if (!tools) return {}

  const [tool1, tool2] = tools
  const comparisonData = await import("~/server/admin/comparisons/queries").then(m =>
    m.findComparisonData(tool1.id, tool2.id),
  )

  const url = `/compare/${slug}`
  const defaultTitle = `${tool1.name} vs ${tool2.name}: Full Comparison (2026) | Features, Pricing & Reviews`
  const defaultDescription = `Compare ${tool1.name} and ${tool2.name} side-by-side. Evaluate features, pricing, deliverability, and more to find the right cold email tool for your outreach.`

  const title = comparisonData?.customTitle || defaultTitle
  const description = comparisonData?.customDescription || defaultDescription

  const keywords = [
    `${tool1.name} vs ${tool2.name}`,
    `${tool2.name} vs ${tool1.name}`,
    `${tool1.name} review`,
    `${tool2.name} review`,
    `${tool1.name} alternative`,
    `${tool2.name} alternative`,
    `${tool1.name} pricing`,
    `${tool2.name} pricing`,
    "cold email tools comparison",
    "email outreach software",
    "best cold email tool",
  ]

  return {
    title,
    description,
    keywords,
    alternates: { ...metadataConfig.alternates, canonical: url },
    openGraph: {
      ...metadataConfig.openGraph,
      url,
      type: "website",
      title,
      description,
    },
  }
}

/**
 * Generate JSON-LD structured data for the comparison page
 */
function generateComparisonSchema(
  tool1: {
    name: string
    slug: string
    overallRating: number | null
    totalReviews: number | null
    pricingStarting: string | null
  },
  tool2: {
    name: string
    slug: string
    overallRating: number | null
    totalReviews: number | null
    pricingStarting: string | null
  },
) {
  return {
    "@type": "WebPage" as const,
    name: `${tool1.name} vs ${tool2.name}: Full Comparison`,
    description: `Side-by-side comparison of ${tool1.name} and ${tool2.name} — features, pricing, reviews, and more.`,
    mainEntity: {
      "@type": "ItemList" as const,
      itemListElement: [
        {
          "@type": "ListItem" as const,
          position: 1,
          name: tool1.name,
          url: `https://coldemailkit.com/tools/${tool1.slug}`,
        },
        {
          "@type": "ListItem" as const,
          position: 2,
          name: tool2.name,
          url: `https://coldemailkit.com/tools/${tool2.slug}`,
        },
      ],
    },
  }
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params
  const [tool1, tool2] = await getTools(slug)
  const [faqs, comparisonData] = await Promise.all([
    findComparisonFaqs(tool1.id, tool2.id),
    import("~/server/admin/comparisons/queries").then(m =>
      m.findComparisonData(tool1.id, tool2.id),
    ),
  ])

  const verdict = comparisonData?.verdict
  const customTitle =
    comparisonData?.customTitle || `${tool1.name} vs ${tool2.name}: Full Comparison (2026)`
  const customDescription =
    comparisonData?.customDescription ||
    `Compare ${tool1.name} and ${tool2.name} side-by-side across features, pricing, deliverability, and more. Find the best cold email tool for your outreach needs.`

  const breadcrumbItems = [
    { name: "Compare", href: "/compare" },
    { name: `${tool1.name} vs ${tool2.name}`, href: `/compare/${slug}` },
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  const comparisonSchema = generateComparisonSchema(tool1, tool2)
  const jsonLd = wrapInGraph(comparisonSchema, breadcrumbSchema)

  return (
    <div className="flex flex-col gap-12">
      <Breadcrumbs
        items={[
          { href: "/compare", name: "Compare" },
          { href: `/compare/${slug}`, name: `${tool1.name} vs ${tool2.name}` },
        ]}
      />

      {/* Page header — centered */}
      <div className="flex flex-col gap-6 items-center text-center">
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <FaviconImage src={tool1.faviconUrl} title={tool1.name} className="size-6" />
            <span className="font-semibold text-lg">{tool1.name}</span>
            <span className="text-muted-foreground text-sm font-medium">vs</span>
            <FaviconImage src={tool2.faviconUrl} title={tool2.name} className="size-6" />
            <span className="font-semibold text-lg">{tool2.name}</span>
          </div>

          <H2 as="h1" className="text-2xl md:text-3xl">
            {customTitle}
          </H2>

          <p className="text-muted-foreground text-sm max-w-2xl">{customDescription}</p>
        </div>

        {/* Quick-Jump Anchor Links */}
        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap border-y w-full py-4 text-sm font-medium text-muted-foreground">
          <a href="#comparison-overview" className="hover:text-foreground transition-colors">
            Overview
          </a>
          <a href="#comparison-table" className="hover:text-foreground transition-colors">
            Features
          </a>
          {verdict && (
            <a href="#comparison-verdict" className="hover:text-foreground transition-colors">
              Verdict
            </a>
          )}
          {faqs.length > 0 && (
            <a href="#comparison-faqs" className="hover:text-foreground transition-colors">
              FAQs
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-12" id="comparison-overview">
        {/* Responsive overview — Stacked on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start lg:grid-rows-[auto_auto_auto_auto_auto]">
          <ComparisonToolCard tool={tool1} isFeatured={tool1.isFeatured} />
          <ComparisonToolCard tool={tool2} isFeatured={tool2.isFeatured} />
        </div>

        {/* Unified Interactive Features Table */}
        <ComparisonTable tool1={tool1} tool2={tool2} />
      </div>

      {/* Final Verdict Section */}
      {verdict && (
        <div
          id="comparison-verdict"
          className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:p-8 shadow-sm scroll-mt-24"
        >
          <H2 className="text-xl md:text-2xl m-0">ColdEmailKit's Verdict</H2>
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
            {verdict}
          </div>
        </div>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <ComparisonFaqs faqs={faqs} tool1Name={tool1.name} tool2Name={tool2.name} />
      )}

      {/* JSON-LD structured data */}
      <script {...jsonLdScriptProps(jsonLd)} />
    </div>
  )
}
