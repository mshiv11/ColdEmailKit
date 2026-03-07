import type { Metadata } from "next"
import { Link } from "~/components/common/link"
import { H1 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { FaviconImage } from "~/components/web/ui/favicon"
import { findAllComparisonPairs } from "~/server/admin/comparisons/queries"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Compare Cold Email Tools (2026): Side-by-Side Feature & Pricing Comparison",
  description:
    "Compare the best cold email tools side-by-side. Evaluate features, pricing, deliverability, and more to find the perfect tool for your outreach needs.",
}

export default async function ComparePage() {
  // Only show comparisons that have been explicitly created by admin (have FAQs)
  const comparisons = await findAllComparisonPairs()

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10">
          <Icon name="lucide/columns-2" className="size-7 text-primary" />
        </div>
        <H1 className="text-3xl md:text-4xl">Compare Cold Email Tools</H1>
        <p className="text-muted-foreground max-w-xl text-base">
          Compare cold email tools side-by-side. Evaluate features, pricing, deliverability, lead
          databases and more to find the right tool for your outreach.
        </p>
      </div>

      {/* Admin-created comparisons only */}
      {comparisons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {comparisons.map((pair) => (
            <Link
              key={pair.id}
              href={`/compare/${pair.slug}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FaviconImage src={pair.tool1.faviconUrl} title={pair.tool1.name} className="size-5 shrink-0" />
                <span className="text-sm font-medium truncate">{pair.tool1.name}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <FaviconImage src={pair.tool2.faviconUrl} title={pair.tool2.name} className="size-5 shrink-0" />
                <span className="text-sm font-medium truncate">{pair.tool2.name}</span>
              </div>
              <Icon
                name="lucide/arrow-right"
                className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="lucide/columns-2" className="size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No comparisons available yet.</p>
        </div>
      )}
    </div>
  )
}
