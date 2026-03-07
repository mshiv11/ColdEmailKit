"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "~/components/common/button"
import { Icon } from "~/components/common/icon"
import { ExternalLink } from "~/components/web/external-link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { Container } from "~/components/web/ui/container"
import type { ComparisonTool } from "~/server/web/comparisons/payloads"
import { cx } from "~/utils/cva"

type ComparisonStickyHeaderProps = {
  tool1: ComparisonTool
  tool2: ComparisonTool
}

export function ComparisonStickyHeader({ tool1, tool2 }: ComparisonStickyHeaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  const headerScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. Vertical visibility scroll tracking
    const handleScroll = () => {
      const cta = document.getElementById("comparison-cta-section")
      if (cta) {
        const rect = cta.getBoundingClientRect()
        setIsVisible(rect.bottom < 80)
      } else {
        setIsVisible(window.scrollY > 400)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    // 2. Horizontal sync scroll tracking
    const mainScrollContainer = document.getElementById("comparison-scroll-container")
    let isSyncing = false

    const handleHorizontalSync = () => {
      if (!headerScrollRef.current || !mainScrollContainer || isSyncing) return
      
      isSyncing = true
      window.requestAnimationFrame(() => {
        if (headerScrollRef.current && mainScrollContainer) {
           headerScrollRef.current.scrollLeft = mainScrollContainer.scrollLeft
        }
        isSyncing = false
      })
    }
    
    // Also sync if the user scrolls the header manually (though scrollbar is hidden, touch swipe could trigger it)
    const handleHeaderScrollSync = () => {
       if (!headerScrollRef.current || !mainScrollContainer || isSyncing) return
       
       isSyncing = true
       window.requestAnimationFrame(() => {
         if (headerScrollRef.current && mainScrollContainer) {
            mainScrollContainer.scrollLeft = headerScrollRef.current.scrollLeft
         }
         isSyncing = false
       })
    }

    if (mainScrollContainer) {
      mainScrollContainer.addEventListener("scroll", handleHorizontalSync, { passive: true })
      
      // Initial sync right after mounting
      handleHorizontalSync()
    }
    
    const currentHeaderRef = headerScrollRef.current
    if (currentHeaderRef) {
       currentHeaderRef.addEventListener("scroll", handleHeaderScrollSync, { passive: true })
    }

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (mainScrollContainer) {
        mainScrollContainer.removeEventListener("scroll", handleHorizontalSync)
      }
      if (currentHeaderRef) {
         currentHeaderRef.removeEventListener("scroll", handleHeaderScrollSync)
      }
    }
  }, [])

  return (
    <div className="sticky top-(--header-offset) z-40 h-0 overflow-visible">
      <div
        className={cx(
          "absolute top-0 inset-x-0 flex items-center bg-background border-b transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0 pointer-events-auto shadow-xs" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <Container className="w-full">
          {/* Layout: horizontally scrolling container matching the comparison cards exactly */}
          <div 
             ref={headerScrollRef}
             className="overflow-x-auto scrollbar-none pb-0"
          >
            <div className="min-w-[700px] grid grid-cols-2 gap-8 items-center py-3">
              
              {/* Tool 1 — left column */}
              <div className="flex items-center justify-between gap-2 px-1 md:px-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FaviconImage src={tool1.faviconUrl} title={tool1.name} className="size-6 shrink-0" />
                  <span className="font-semibold text-sm leading-none truncate">
                    {tool1.name}
                  </span>
                </div>
                <Button variant="cta" size="sm" suffix={<Icon name="lucide/arrow-up-right" className="size-3.5" />} asChild>
                  <ExternalLink
                    href={tool1.affiliateUrl || tool1.websiteUrl}
                    doFollow={tool1.isFeatured}
                    eventName="click_website"
                    eventProps={{ url: tool1.websiteUrl, source: "sticky_comparison" }}
                  >
                    Visit {tool1.name}
                  </ExternalLink>
                </Button>
              </div>

              {/* Tool 2 — right column */}
              <div className="flex items-center justify-between gap-2 px-1 md:px-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FaviconImage src={tool2.faviconUrl} title={tool2.name} className="size-6 shrink-0" />
                  <span className="font-semibold text-sm leading-none truncate">
                    {tool2.name}
                  </span>
                </div>
                <Button variant="cta" size="sm" suffix={<Icon name="lucide/arrow-up-right" className="size-3.5" />} asChild>
                  <ExternalLink
                    href={tool2.affiliateUrl || tool2.websiteUrl}
                    doFollow={tool2.isFeatured}
                    eventName="click_website"
                    eventProps={{ url: tool2.websiteUrl, source: "sticky_comparison" }}
                  >
                    Visit {tool2.name}
                  </ExternalLink>
                </Button>
              </div>

            </div>
          </div>
        </Container>
      </div>
    </div>
  )
}
