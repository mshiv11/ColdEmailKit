"use client"

import { ReactNode, useState, useRef, useEffect } from "react"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/common/popover"
import { type ToolOne } from "~/server/web/tools/payloads"
import { formatNumber } from "@primoui/utils"

type PlatformKey = "g2" | "trustpilot" | "capterra" | "trustradius" | "coldEmailKit"

const PLATFORMS: Record<PlatformKey, { name: string; domain: string }> = {
  g2: { name: "G2", domain: "g2.com" },
  trustpilot: { name: "Trustpilot", domain: "trustpilot.com" },
  capterra: { name: "Capterra", domain: "capterra.com" },
  trustradius: { name: "TrustRadius", domain: "trustradius.com" },
  coldEmailKit: { name: "ColdEmailKit", domain: "coldemailkit.com" },
}

// Ensure compatibility with both payloads
type ToolLike = Pick<
  ToolOne,
  | "g2Rating"
  | "g2Reviews"
  | "trustpilotRating"
  | "trustpilotReviews"
  | "capterraRating"
  | "capterraReviews"
  | "trustradiusRating"
  | "trustradiusReviews"
  | "coldEmailKitRating"
  | "coldEmailKitReviews"
>

type TrustBreakdownHoverProps = {
  children: ReactNode
  tool: ToolLike
}

function PlatformRow({
  platformKey,
  rating,
  reviews,
}: {
  platformKey: PlatformKey
  rating: number
  reviews: number
}) {
  const platform = PLATFORMS[platformKey]
  const logoUrl = `https://img.logo.dev/${platform.domain}?token=pk_Q7EiWOmsTIuV9Yy-00JRvQ`

  // TrustRadius uses a 0-10 scale natively, others use 0-5
  const maxRating = platformKey === "trustradius" ? 10 : 5
  const displayRating = rating.toFixed(1)

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2">
        <img
          src={logoUrl}
          alt={`${platform.name} logo`}
          className="size-5 rounded-sm object-contain bg-white"
        />
        <span className="text-sm font-medium">{platform.name}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-0.5 text-yellow-500">
          <span className="font-medium text-foreground">{displayRating}</span>
          <span className="text-[10px] text-muted-foreground">/{maxRating}</span>
          <Icon name="lucide/star" className="size-3.5 fill-current ml-0.5" />
        </div>
        <span>({formatNumber(reviews, "standard")})</span>
      </div>
    </div>
  )
}

export function TrustBreakdownHover({ children, tool }: TrustBreakdownHoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const platformsData: { key: PlatformKey; rating: number; reviews: number }[] = [
    { key: "g2", rating: tool.g2Rating ?? 0, reviews: tool.g2Reviews ?? 0 },
    { key: "trustpilot", rating: tool.trustpilotRating ?? 0, reviews: tool.trustpilotReviews ?? 0 },
    { key: "capterra", rating: tool.capterraRating ?? 0, reviews: tool.capterraReviews ?? 0 },
    { key: "trustradius", rating: tool.trustradiusRating ?? 0, reviews: tool.trustradiusReviews ?? 0 },
    { key: "coldEmailKit", rating: tool.coldEmailKitRating ?? 0, reviews: tool.coldEmailKitReviews ?? 0 },
  ]

  const activePlatforms = platformsData.filter(p => p.rating > 0 && p.reviews > 0)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // If there's no active platforms, just render the children without popover
  if (activePlatforms.length === 0) {
    return <>{children}</>
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Adds a small delay similar to HoverCard
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="inline-flex cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        side="bottom" 
        align="start" 
        className="w-[320px] p-0 overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 flex flex-col gap-1 border-b bg-muted/30">
          <p className="text-sm font-semibold">Trust Score Breakdown</p>
          <p className="text-xs text-muted-foreground">
             Weighted average prioritizing ColdEmailKit reviews (40%) and aggregating external verified sources (60%).
          </p>
        </div>
        
        <div className="flex flex-col p-2">
          {activePlatforms.map(p => (
            <PlatformRow key={p.key} platformKey={p.key} rating={p.rating} reviews={p.reviews} />
          ))}
        </div>

        <div className="p-3 border-t bg-muted/20">
          <Link
            href="/methodology"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            How is this calculated? <Icon name="lucide/arrow-right" className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
