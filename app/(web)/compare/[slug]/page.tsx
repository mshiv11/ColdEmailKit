import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { ComparisonFaqs } from "~/components/web/compare/comparison-faqs"
import { ComparisonStickyHeader } from "~/components/web/compare/comparison-sticky-header"
import { ComparisonToolCard } from "~/components/web/compare/comparison-tool-card"
import { ExternalLink } from "~/components/web/external-link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { metadataConfig } from "~/config/metadata"
import { generateBreadcrumbSchema, jsonLdScriptProps, wrapInGraph } from "~/lib/schemas"
import { findComparisonFaqs, findComparisonTools } from "~/server/web/comparisons/queries"

export const revalidate = 86400

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
  const url = `/compare/${slug}`
  const title = `${tool1.name} vs ${tool2.name}: Full Comparison (2026) | Features, Pricing & Reviews`
  const description = `Compare ${tool1.name} and ${tool2.name} side-by-side. Evaluate features, pricing, deliverability, and more to find the right cold email tool for your outreach.`

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
function generateComparisonSchema(tool1: { name: string; slug: string; overallRating: number | null; totalReviews: number | null; pricingStarting: string | null }, tool2: { name: string; slug: string; overallRating: number | null; totalReviews: number | null; pricingStarting: string | null }) {
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
  const faqs = await findComparisonFaqs(tool1.id, tool2.id)

  const breadcrumbItems = [
    { name: "Compare", href: "/compare" },
    { name: `${tool1.name} vs ${tool2.name}`, href: `/compare/${slug}` },
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  const comparisonSchema = generateComparisonSchema(tool1, tool2)
  const jsonLd = wrapInGraph(comparisonSchema, breadcrumbSchema)

  return (
    <div className="flex flex-col gap-12">
      {/* Sticky header */}
      <ComparisonStickyHeader tool1={tool1} tool2={tool2} />

      <Breadcrumbs
        items={[
          { href: "/compare", name: "Compare" },
          { href: `/compare/${slug}`, name: `${tool1.name} vs ${tool2.name}` },
        ]}
      />

      {/* Page header — centered */}
      <div className="flex flex-col gap-3 items-center text-center">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <FaviconImage src={tool1.faviconUrl} title={tool1.name} className="size-6" />
          <span className="font-semibold text-lg">{tool1.name}</span>
          <span className="text-muted-foreground text-sm font-medium">vs</span>
          <FaviconImage src={tool2.faviconUrl} title={tool2.name} className="size-6" />
          <span className="font-semibold text-lg">{tool2.name}</span>
        </div>

        <H2 as="h1" className="text-2xl md:text-3xl">
          {tool1.name} vs {tool2.name}: Full Comparison (2026)
        </H2>

        <p className="text-muted-foreground text-sm max-w-2xl">
          Compare {tool1.name} and {tool2.name} side-by-side across features, pricing,
          deliverability, and more. Find the best cold email tool for your outreach needs.
        </p>
      </div>

      {/* Two-column comparison — subgrid for cross-column alignment */}
      <div 
        id="comparison-scroll-container"
        className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
      >
        <div className="min-w-[700px] grid grid-cols-2 gap-8 items-start md:grid-rows-[auto_auto_auto_auto_auto_auto]">
          <ComparisonToolCard tool={tool1} />
          <ComparisonToolCard tool={tool2} />
        </div>
      </div>

      {/* VS divider banner — centered with CTA buttons */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 border-t" />
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground">
            <Icon name="lucide/columns-2" className="size-4" />
            <span>{tool1.name}</span>
            <span className="text-xs font-bold">vs</span>
            <span>{tool2.name}</span>
          </div>
          <div className="flex-1 border-t" />
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            variant="cta"
            size="sm"
            suffix={<Icon name="lucide/arrow-up-right" className="size-3.5" />}
            asChild
          >
            <ExternalLink
              href={tool1.affiliateUrl || tool1.websiteUrl}
              doFollow={tool1.isFeatured}
              eventName="click_website"
              eventProps={{ url: tool1.websiteUrl, source: "comparison_vs_banner" }}
            >
              Visit {tool1.name}
            </ExternalLink>
          </Button>

          <Button
            variant="cta"
            size="sm"
            suffix={<Icon name="lucide/arrow-up-right" className="size-3.5" />}
            asChild
          >
            <ExternalLink
              href={tool2.affiliateUrl || tool2.websiteUrl}
              doFollow={tool2.isFeatured}
              eventName="click_website"
              eventProps={{ url: tool2.websiteUrl, source: "comparison_vs_banner" }}
            >
              Visit {tool2.name}
            </ExternalLink>
          </Button>
        </div>
      </div>

      {/* FAQs */}
      {faqs.length > 0 && (
        <ComparisonFaqs faqs={faqs} tool1Name={tool1.name} tool2Name={tool2.name} />
      )}

      {/* JSON-LD structured data */}
      <script {...jsonLdScriptProps(jsonLd)} />
    </div>
  )
}
