import Image from "next/image"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { ExternalLink } from "~/components/web/external-link"
import { ComparisonToolDetails } from "~/components/web/compare/comparison-tool-details"
import { StarRating } from "~/components/web/tools/star-rating"
import { TrustBreakdownHover } from "~/components/web/tools/trust-breakdown-hover"
import { FaviconImage } from "~/components/web/ui/favicon"
import { VerifiedBadge } from "~/components/web/verified-badge"
import { Tooltip } from "~/components/common/tooltip"
import type { ComparisonTool } from "~/server/web/comparisons/payloads"

type ComparisonToolCardProps = {
  tool: ComparisonTool
  isFeatured?: boolean
  customDescription?: string | null
}

/**
 * Single-tool column for the comparison page.
 * Uses CSS subgrid rows so sections align across the two columns.
 * Row order: header | description | CTA | screenshot | details
 */
export function ComparisonToolCard({ tool, isFeatured, customDescription }: ComparisonToolCardProps) {
  const href = tool.affiliateUrl || tool.websiteUrl
  const description = customDescription || tool.description

  return (
    <div className="grid grid-rows-subgrid row-span-5 gap-6">
      {/* Row 1 — Header: favicon + name + rating */}
      <div className="flex items-start gap-3">
        <FaviconImage src={tool.faviconUrl} title={tool.name} className="size-8 shrink-0 mt-1" />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <H2 as="h2" className="text-xl">
              {tool.name}
            </H2>
            {isFeatured && (
              <Tooltip tooltip="Featured Tool">
                <Icon
                  name="lucide/crown"
                  className="size-4 text-orange-500 fill-current shrink-0"
                  aria-label="Featured Tool"
                />
              </Tooltip>
            )}
            {tool.owner?.role && tool.owner.role !== "admin" && <VerifiedBadge size="md" />}
          </div>

          <TrustBreakdownHover tool={tool}>
            <StarRating
              rating={tool.overallRating || 0}
              totalReviews={tool.totalReviews ?? undefined}
              trustScore={tool.trustScore || undefined}
              showTrustScore={!!tool.trustScore}
            />
          </TrustBreakdownHover>
        </div>
      </div>

      {/* Row 2 — Description */}
      <div className="min-h-0">
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
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
          <Link href={`/tools/${tool.slug}`}>Read more</Link>
        </Button>
      </div>

      {/* Row 4 — Screenshot */}
      <div className="min-h-0">
        {tool.screenshotUrl && (
          <ExternalLink
            href={href}
            doFollow={tool.isFeatured}
            eventName="click_website"
            eventProps={{
              url: tool.websiteUrl,
              isFeatured: tool.isFeatured,
              source: "comparison_screenshot",
            }}
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
    </div>
  )
}
