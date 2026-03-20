import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { cx } from "~/utils/cva"

type ComparisonLink = {
  slug: string
  tool1: { name: string; slug: string; faviconUrl: string | null }
  tool2: { name: string; slug: string; faviconUrl: string | null }
}

type ToolComparisonsProps = {
  toolName: string
  comparisons: ComparisonLink[]
  className?: string
}

/**
 * "Still deciding?" recovery section that links to comparison pages.
 * Placed strategically below features to capture undecided users.
 */
export function ToolComparisons({ toolName, comparisons, className }: ToolComparisonsProps) {
  if (!comparisons.length) return null

  return (
    <div className={cx("flex flex-col gap-4 w-full", className)}>
      <H2 className="text-xl">Compare {toolName}</H2>

      <div className="grid gap-2 sm:grid-cols-2">
        {comparisons.map(comparison => (
          <Link
            key={comparison.slug}
            href={`/compare/${comparison.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FaviconImage
                src={comparison.tool1.faviconUrl}
                title={comparison.tool1.name}
                className="size-5 shrink-0"
              />
              <span className="text-sm font-medium truncate">{comparison.tool1.name}</span>
            </div>

            <span className="text-xs font-semibold text-muted-foreground uppercase shrink-0">
              vs
            </span>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium truncate">{comparison.tool2.name}</span>
              <FaviconImage
                src={comparison.tool2.faviconUrl}
                title={comparison.tool2.name}
                className="size-5 shrink-0"
              />
            </div>

            <Icon
              name="lucide/arrow-right"
              className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
