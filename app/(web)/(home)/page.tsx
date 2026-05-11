import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { CountBadge, CountBadgeSkeleton } from "~/app/(web)/(home)/count-badge"
import { AlternativePreviewSkeleton } from "~/components/web/alternatives/alternative-preview"
import { AlternativePreview } from "~/components/web/alternatives/alternative-preview"
import { BuiltWith } from "~/components/web/built-with"
import {
  CategoryPreview,
  CategoryPreviewSkeleton,
} from "~/components/web/categories/category-preview"
import {
  ComparisonPreview,
  ComparisonPreviewSkeleton,
} from "~/components/web/compare/comparison-preview"
import { ContributionGraph } from "~/components/web/contribution-graph"
import { NewsletterForm } from "~/components/web/newsletter-form"
import { FAQSchema, generateHomepageFAQs } from "~/components/web/seo/faq-schema"

import { ToolListingSkeleton } from "~/components/web/tools/tool-listing"
import { ToolQuery } from "~/components/web/tools/tool-query"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { config } from "~/config"
import { metadataConfig } from "~/config/metadata"
import {
  generateFAQPageSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  jsonLdScriptProps,
  wrapInGraph,
} from "~/lib/schemas"

export const metadata: Metadata = {
  title: "Best Cold Email Tools & Software Database (2026)",
  description:
    "Compare 50+ cold email tools with verified reviews, detailed features, and transparent pricing — from inbox rotation to deliverability audits. Find the perfect tool for your outreach.",
  openGraph: { ...metadataConfig.openGraph, url: "/" },
  alternates: { ...metadataConfig.alternates, canonical: "/" },
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export const revalidate = 604800 // Cache for 7 days (on-demand revalidation via revalidateTag handles freshness)

export default function Home(props: PageProps) {
  const homepageFAQs = generateHomepageFAQs()

  // Build comprehensive JSON-LD for homepage SEO
  const jsonLd = wrapInGraph(
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateFAQPageSchema(homepageFAQs),
  )

  return (
    <>
      <section className="relative flex flex-col justify-center gap-y-6 pb-18">
        <div className="absolute left-1/2 bottom-0 -z-10 w-dvw h-3/5 border-b bg-gradient-to-t from-card to-transparent -translate-x-1/2 select-none overflow-clip dark:from-background/95 dark:border-card-dark">
          <ContributionGraph className="size-full object-cover mask-t-from-0% opacity-10 translate-y-1 dark:mix-blend-color-dodge" />
        </div>

        <Intro alignment="center">
          <IntroTitle className="max-w-[16em] sm:text-4xl md:text-5xl lg:text-6xl">
            Find the Perfect Cold Email Tools for Your Outreach
          </IntroTitle>

          <IntroDescription className="lg:mt-2">
            Compare 50+ cold email tools with verified reviews, detailed features, and transparent
            pricing from inbox rotation to deliverability audits and stop paying for tools that
            don't scale.
          </IntroDescription>

          <Suspense fallback={<CountBadgeSkeleton />}>
            <CountBadge />
          </Suspense>
        </Intro>

        <NewsletterForm
          size="lg"
          className="max-w-sm mx-auto items-center text-center"
          buttonProps={{ children: "Join our community", size: "md", variant: "cta" }}
        />

        <BuiltWith medium="hero" className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs" />
      </section>

      <Suspense fallback={<ToolListingSkeleton />}>
        <ToolQuery searchParams={props.searchParams} options={{ enableFilters: true }} />
      </Suspense>

      <Suspense fallback={<CategoryPreviewSkeleton />}>
        <CategoryPreview />
      </Suspense>

      <Suspense fallback={<AlternativePreviewSkeleton />}>
        <AlternativePreview />
      </Suspense>

      <Suspense fallback={<ComparisonPreviewSkeleton />}>
        <ComparisonPreview />
      </Suspense>

      {/* JSON-LD for SEO: Organization, WebSite with SearchAction, FAQPage */}
      <script {...jsonLdScriptProps(jsonLd)} />
    </>
  )
}
