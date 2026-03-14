import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { Listing } from "~/components/web/listing"
import { FaviconImage } from "~/components/web/ui/favicon"
import { findRelatedComparisons } from "~/server/web/comparisons/queries"

type RelatedComparisonsProps = {
  tool1Id: string
  tool2Id: string
  currentSlug: string
}

export const RelatedComparisons = async ({
  tool1Id,
  tool2Id,
  currentSlug,
}: RelatedComparisonsProps) => {
  const related = await findRelatedComparisons(tool1Id, tool2Id, currentSlug)

  if (!related.length) {
    return null
  }

  return (
    <Listing title="Related Comparisons:" separated>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {related.map(pair => (
          <Link
            key={pair.slug}
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
