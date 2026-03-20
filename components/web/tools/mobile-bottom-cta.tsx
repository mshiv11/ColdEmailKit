"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/common/button"
import { Icon } from "~/components/common/icon"
import { ExternalLink } from "~/components/web/external-link"
import type { ToolOne } from "~/server/web/tools/payloads"

type MobileBottomCTAProps = {
  tool: ToolOne
}

/**
 * Fixed bottom CTA bar for mobile devices.
 * Appears after the user scrolls past the hero CTA button.
 * Provides a persistent "Visit [Tool]" action under the user's thumb.
 */
export function MobileBottomCTA({ tool }: MobileBottomCTAProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const btn = document.getElementById("tool-hero-cta")
      if (btn) {
        const rect = btn.getBoundingClientRect()
        // Show when the hero CTA scrolls out of view
        setIsVisible(rect.bottom < 0)
      } else {
        setIsVisible(window.scrollY > 400)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 md:hidden transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-full pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold truncate">{tool.name}</span>
          {tool.overallRating ? (
            <span className="text-xs text-muted-foreground shrink-0">
              ★ {tool.overallRating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <Button
          variant="cta"
          size="sm"
          suffix={<Icon name="lucide/arrow-up-right" className="size-3.5" />}
          asChild
        >
          <ExternalLink
            href={tool.affiliateUrl || tool.websiteUrl}
            doFollow={tool.isFeatured}
            eventName="click_website"
            eventProps={{
              url: tool.websiteUrl,
              isFeatured: tool.isFeatured,
              source: "mobile_bottom_cta",
            }}
          >
            Visit {tool.name}
          </ExternalLink>
        </Button>
      </div>
    </div>
  )
}
