import Image from "next/image"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { ExternalLink } from "~/components/web/external-link"
import { ComparisonToolDetails } from "~/components/web/compare/comparison-tool-details"
import { StarRating } from "~/components/web/tools/star-rating"
import { ToolFeaturesDisplay } from "~/components/web/tools/tool-features-display"
import { FaviconImage } from "~/components/web/ui/favicon"
import { VerifiedBadge } from "~/components/web/verified-badge"
import type { ComparisonTool } from "~/server/web/comparisons/payloads"

type ComparisonToolCardProps = {
  tool: ComparisonTool
}

/**
 * Single-tool column for the comparison page.
 * Uses CSS subgrid rows so sections align across the two columns.
 * Row order: header | description | CTA | screenshot | details | features
 */
export function ComparisonToolCard({ tool }: ComparisonToolCardProps) {
  const href = tool.affiliateUrl || tool.websiteUrl
  const description = tool.comparisonDescription || tool.description

  return (
    <div className="grid grid-rows-subgrid row-span-6 gap-6">
      {/* Row 1 — Header: favicon + name + rating */}
      <div className="flex items-start gap-3">
        <FaviconImage src={tool.faviconUrl} title={tool.name} className="size-8 shrink-0 mt-1" />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <H2 as="h2" className="text-xl">
              {tool.name}
            </H2>
            {tool.ownerId && <VerifiedBadge size="md" />}
          </div>

          <StarRating
            rating={tool.overallRating || 0}
            totalReviews={tool.totalReviews ?? undefined}
            trustScore={tool.trustScore || undefined}
            showTrustScore={!!tool.trustScore}
          />
        </div>
      </div>

      {/* Row 2 — Description */}
      <div className="min-h-0">
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>

      {/* Row 3 — CTA buttons */}
      <div className="flex flex-col sm:flex-row items-start gap-3" id="comparison-cta-section">
        <Button
          variant="cta"
          suffix={<Icon name="lucide/arrow-up-right" />}
          className="w-full sm:w-auto"
          asChild
        >
          <ExternalLink
            href={href}
            doFollow={tool.isFeatured}
            eventName="click_website"
            eventProps={{ url: tool.websiteUrl, isFeatured: tool.isFeatured, source: "comparison" }}
          >
            Visit {tool.name}
          </ExternalLink>
        </Button>

        <Button
          variant="secondary"
          size="md"
          suffix={<Icon name="lucide/arrow-right" />}
          className="w-full sm:w-auto"
          asChild
        >
          <Link href={`/tools/${tool.slug}`}>
            Read more
          </Link>
        </Button>
      </div>

      {/* Row 4 — Screenshot */}
      <div className="min-h-0">
        {tool.screenshotUrl && (
          <ExternalLink
            href={href}
            doFollow={tool.isFeatured}
            eventName="click_website"
            eventProps={{ url: tool.websiteUrl, isFeatured: tool.isFeatured, source: "comparison_screenshot" }}
            className="block rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
          >
            <Image
              src={tool.screenshotUrl}
              alt={`Screenshot of ${tool.name}`}
              width={1280}
              height={720}
              className="w-full h-auto object-cover object-top"
              loading="lazy"
            />
          </ExternalLink>
        )}
      </div>

      {/* Row 5 — Details card (rating, reviews, trust score, pricing) */}
      <ComparisonToolDetails tool={tool} />

      {/* Row 6 — Features display */}
      <ToolFeaturesDisplay
        specifications={tool.specifications as Parameters<typeof ToolFeaturesDisplay>[0]["specifications"]}
        pricingSpecs={tool.pricingSpecs as Parameters<typeof ToolFeaturesDisplay>[0]["pricingSpecs"]}
        inboxFeatures={tool.inboxFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["inboxFeatures"]}
        warmupFeatures={tool.warmupFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["warmupFeatures"]}
        leadsFeatures={tool.leadsFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["leadsFeatures"]}
        enrichmentFeatures={tool.enrichmentFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["enrichmentFeatures"]}
        copywritingFeatures={tool.copywritingFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["copywritingFeatures"]}
        outreachFeatures={tool.outreachFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["outreachFeatures"]}
        deliverabilityFeatures={tool.deliverabilityFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["deliverabilityFeatures"]}
        linkedinFeatures={tool.linkedinFeatures as Parameters<typeof ToolFeaturesDisplay>[0]["linkedinFeatures"]}
      />
    </div>
  )
}
