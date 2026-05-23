import Image from "next/image"
import { headers } from "next/headers"
import type { ComponentProps } from "react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { Container } from "~/components/web/ui/container"
import { findAd } from "~/server/web/ads/queries"
import { cx } from "~/utils/cva"

const getPageTypeFromPathname = (path: string) => {
  if (path === "/") return "home"
  if (path.startsWith("/categories")) return "category"
  if (path.startsWith("/tools")) return "tool"
  if (path.startsWith("/blog")) return "blog"
  if (path.startsWith("/alternatives")) return "alternatives"
  return "other"
}

export const AdBanner = async ({ className, ...props }: ComponentProps<typeof Card>) => {
  const headerList = await headers()
  const pathname = headerList.get("x-current-path") || "/"
  const pageType = getPageTypeFromPathname(pathname)

  // Find active banner targeting this page or global
  const ad = await findAd({
    where: {
      type: "Banner",
      OR: [
        { displayPages: { has: pageType } },
        { displayPages: { has: "all" } },
        { displayPages: { equals: [] } }
      ]
    }
  })

  if (!ad) {
    return null
  }

  return (
    <Container className="z-49 mt-1">
      <Card
        className={cx("flex-row items-center gap-3 px-3 py-2.5 md:px-4", className)}
        asChild
        {...props}
      >
        <Link
          href="/advertisement"
          className="no-underline flex items-center w-full justify-between"
        >
          <Badge variant="outline" className="leading-none max-sm:order-last">
            Ad
          </Badge>

          <div className="text-xs leading-tight text-secondary-foreground mr-auto sm:text-sm flex items-center">
            {ad.faviconUrl && (
              <Image
                src={ad.faviconUrl}
                alt={ad.name}
                width={16}
                height={16}
                className="align-middle mr-1.5 size-3.5 rounded-sm sm:size-4 object-contain"
              />
            )}
            <div>
              <strong className="font-medium text-foreground">{ad.name}</strong> — {ad.description}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 leading-none pointer-events-none max-sm:hidden"
            asChild
          >
            <span>{ad.buttonLabel ?? "Learn More"}</span>
          </Button>
        </Link>
      </Card>
    </Container>
  )
}
