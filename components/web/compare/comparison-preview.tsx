import { Link } from "~/components/common/link"
import { Icon } from "~/components/common/icon"
import { Skeleton } from "~/components/common/skeleton"
import { Listing } from "~/components/web/listing"
import { FaviconImage } from "~/components/web/ui/favicon"
import { findAllComparisonPairs } from "~/server/admin/comparisons/queries"

const ComparisonPreview = async () => {
  const comparisons = await findAllComparisonPairs()

  if (!comparisons.length) {
    return null
  }

  // Show up to 6 comparisons
  const displayComparisons = comparisons.slice(0, 6)

  return (
    <Listing
      title="Compare Cold Email Tools:"
      button={<Link href="/compare">View all comparisons</Link>}
      separated
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {displayComparisons.map(pair => (
          <Link
            key={pair.id}
            href={`/compare/${pair.slug}`}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FaviconImage
                src={pair.tool1.faviconUrl}
                title={pair.tool1.name}
                className="size-5 shrink-0"
              />
              <span className="text-sm font-medium truncate">{pair.tool1.name}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <FaviconImage
                src={pair.tool2.faviconUrl}
                title={pair.tool2.name}
                className="size-5 shrink-0"
              />
              <span className="text-sm font-medium truncate">{pair.tool2.name}</span>
            </div>
            <Icon
              name="lucide/arrow-right"
              className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors"
            />
          </Link>
        ))}
      </div>
    </Listing>
  )
}

const ComparisonPreviewSkeleton = () => {
  return (
    <Listing title="Compare Cold Email Tools:">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Skeleton className="size-5 rounded-full shrink-0">&nbsp;</Skeleton>
              <Skeleton className="h-4 w-16">&nbsp;</Skeleton>
              <span className="text-xs text-muted-foreground">vs</span>
              <Skeleton className="size-5 rounded-full shrink-0">&nbsp;</Skeleton>
              <Skeleton className="h-4 w-16">&nbsp;</Skeleton>
            </div>
          </div>
        ))}
      </div>
    </Listing>
  )
}

export { ComparisonPreview, ComparisonPreviewSkeleton }
