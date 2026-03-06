"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/common/button"
import { Icon } from "~/components/common/icon"
import { ExternalLink } from "~/components/web/external-link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { VerifiedBadge } from "~/components/web/verified-badge"
import type { ToolOne } from "~/server/web/tools/payloads"
import { cx } from "~/utils/cva"

type StickyToolHeaderProps = {
    tool: ToolOne
}

export function StickyToolHeader({ tool }: StickyToolHeaderProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const btn = document.getElementById("tool-hero-cta")
            if (btn) {
                const rect = btn.getBoundingClientRect()
                if (rect.bottom < 80) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            } else {
                if (window.scrollY > 400) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            }
        }

        handleScroll()
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="sticky top-(--header-offset) z-40 h-0 overflow-visible">
            <div
                className={cx(
                    "absolute top-0 inset-x-0 flex items-center justify-between py-1.5 bg-background transition-all duration-300",
                    isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <FaviconImage src={tool.faviconUrl} title={tool.name} className="size-6" />
                    <span className="font-semibold text-sm leading-none truncate max-w-[140px] sm:max-w-[200px] md:max-w-[280px]">
                        {tool.name}
                    </span>
                    {tool.ownerId && <VerifiedBadge size="sm" />}
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
                            source: "sticky_header",
                        }}
                    >
                        Visit {tool.name}
                    </ExternalLink>
                </Button>
            </div>
        </div>
    )
}
