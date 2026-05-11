"use client"

import { useState } from "react"
import { H3 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { RatingDots } from "~/components/common/rating-dots"
import {
  type ToolSpecifications,
  defaultSpecifications,
  hasAnyFeatures,
  parseFeatures,
  specificationLabels,
} from "~/types/specifications"
import { cx } from "~/utils/cva"

interface ToolSpecificationsProps {
  specifications: ToolSpecifications | null | undefined
  className?: string
}

/**
 * Displays the core specifications as a rating bar table
 */
export function ToolSpecificationsDisplay({ specifications, className }: ToolSpecificationsProps) {
  const specs = parseFeatures(specifications, defaultSpecifications)

  // Don't render if no specifications are set
  if (!hasAnyFeatures(specs)) {
    return null
  }

  // Filter out null and 0 ratings - only show specs with actual ratings > 0
  const entries = (Object.keys(specificationLabels) as Array<keyof ToolSpecifications>).filter(
    key => {
      const value = specs[key]
      return value !== null && value > 0
    },
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={cx("rounded-lg border bg-card", className)}>
      <div className="p-4 border-b bg-muted/30">
        <H3 className="text-base font-semibold flex items-center gap-2">
          <Icon name="lucide/blocks" className="size-4 text-primary" />
          Core Specifications
        </H3>
      </div>

      <div className="divide-y">
        {entries.map(key => {
          const value = specs[key]
          if (value === null) return null

          return (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{specificationLabels[key].label}</p>
                <p className="text-xs text-muted-foreground">
                  {specificationLabels[key].description}
                </p>
              </div>
              <RatingDots value={value} max={5} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
