"use client"

import { cx } from "~/utils/cva"

interface RatingDotsProps {
  value: number
  max?: number
}

/**
 * Displays a rating as filled/unfilled dots
 */
export function RatingDots({ value, max = 5 }: RatingDotsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cx(
            "size-2.5 rounded-full transition-colors",
            i < value ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap">
        {value}/{max}
      </span>
    </div>
  )
}
