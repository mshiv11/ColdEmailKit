"use client"

import { useState, useMemo } from "react"
import { Icon } from "~/components/common/icon"
import { Input } from "~/components/common/input"
import { Switch } from "~/components/common/switch"
import { Button } from "~/components/common/button"
import { ExternalLink } from "~/components/web/external-link"
import { RatingDots } from "~/components/common/rating-dots"
import { FaviconImage } from "~/components/web/ui/favicon"
import type { ComparisonTool } from "~/server/web/comparisons/payloads"
import {
  parseFeatures,
  hasAnyFeatures,
  defaultSpecifications,
  specificationLabels,
  defaultPricingSpecs,
  pricingSpecsLabels,
  defaultInboxFeatures,
  inboxFeaturesLabels,
  defaultWarmupFeatures,
  warmupFeaturesLabels,
  defaultLeadsFeatures,
  leadsFeaturesLabels,
  defaultEnrichmentFeatures,
  enrichmentFeaturesLabels,
  defaultCopywritingFeatures,
  copywritingFeaturesLabels,
  defaultOutreachFeatures,
  outreachFeaturesLabels,
  defaultDeliverabilityFeatures,
  deliverabilityFeaturesLabels,
  defaultLinkedInFeatures,
  linkedInFeaturesLabels,
} from "~/types/specifications"

type ComparisonTableProps = {
  tool1: ComparisonTool
  tool2: ComparisonTool
}

// Utility to normalize values for rendering and comparison
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-"
  if (typeof value === "number") {
    if (value === 0) return "-" // 0 means not set for ratings
    return `${value}/5`
  }
  if (typeof value === "string") return value || "-"
  return String(value)
}

function TableCellValue({ value }: { value: string }) {
  if (value && value.endsWith("/5") && value !== "/5") {
    const num = parseFloat(value.split("/")[0])
    if (!isNaN(num)) {
      return <RatingDots value={num} max={5} />
    }
  }
  return <span className="text-sm font-medium md:font-normal">{value}</span>
}

export function ComparisonTable({ tool1, tool2 }: ComparisonTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hideCommon, setHideCommon] = useState(false)
  const [highlightDifferences, setHighlightDifferences] = useState(true)

  // Map out exactly what categories we have and the underlying labels
  const categories = useMemo(
    () => [
      {
        id: "specifications",
        title: "Core Specifications",
        icon: "lucide/server",
        labels: specificationLabels,
        defaults: defaultSpecifications,
        t1Data: parseFeatures(tool1.specifications, defaultSpecifications),
        t2Data: parseFeatures(tool2.specifications, defaultSpecifications),
      },
      {
        id: "pricing",
        title: "Pricing Details",
        icon: "lucide/dollar-sign",
        labels: pricingSpecsLabels,
        defaults: defaultPricingSpecs,
        t1Data: parseFeatures(tool1.pricingSpecs, defaultPricingSpecs),
        t2Data: parseFeatures(tool2.pricingSpecs, defaultPricingSpecs),
      },
      {
        id: "inbox",
        title: "Inbox Features",
        icon: "lucide/inbox",
        labels: inboxFeaturesLabels,
        defaults: defaultInboxFeatures,
        t1Data: parseFeatures(tool1.inboxFeatures, defaultInboxFeatures),
        t2Data: parseFeatures(tool2.inboxFeatures, defaultInboxFeatures),
      },
      {
        id: "warmup",
        title: "Warm-up Features",
        icon: "lucide/sparkles",
        labels: warmupFeaturesLabels,
        defaults: defaultWarmupFeatures,
        t1Data: parseFeatures(tool1.warmupFeatures, defaultWarmupFeatures),
        t2Data: parseFeatures(tool2.warmupFeatures, defaultWarmupFeatures),
      },
      {
        id: "leads",
        title: "Lead Database",
        icon: "lucide/users",
        labels: leadsFeaturesLabels,
        defaults: defaultLeadsFeatures,
        t1Data: parseFeatures(tool1.leadsFeatures, defaultLeadsFeatures),
        t2Data: parseFeatures(tool2.leadsFeatures, defaultLeadsFeatures),
      },
      {
        id: "enrichment",
        title: "Data Enrichment",
        icon: "lucide/blocks",
        labels: enrichmentFeaturesLabels,
        defaults: defaultEnrichmentFeatures,
        t1Data: parseFeatures(tool1.enrichmentFeatures, defaultEnrichmentFeatures),
        t2Data: parseFeatures(tool2.enrichmentFeatures, defaultEnrichmentFeatures),
      },
      {
        id: "copywriting",
        title: "AI Copywriting",
        icon: "lucide/pencil",
        labels: copywritingFeaturesLabels,
        defaults: defaultCopywritingFeatures,
        t1Data: parseFeatures(tool1.copywritingFeatures, defaultCopywritingFeatures),
        t2Data: parseFeatures(tool2.copywritingFeatures, defaultCopywritingFeatures),
      },
      {
        id: "outreach",
        title: "Email Outreach",
        icon: "lucide/rss",
        labels: outreachFeaturesLabels,
        defaults: defaultOutreachFeatures,
        t1Data: parseFeatures(tool1.outreachFeatures, defaultOutreachFeatures),
        t2Data: parseFeatures(tool2.outreachFeatures, defaultOutreachFeatures),
      },
      {
        id: "deliverability",
        title: "Deliverability",
        icon: "lucide/shield-half",
        labels: deliverabilityFeaturesLabels,
        defaults: defaultDeliverabilityFeatures,
        t1Data: parseFeatures(tool1.deliverabilityFeatures, defaultDeliverabilityFeatures),
        t2Data: parseFeatures(tool2.deliverabilityFeatures, defaultDeliverabilityFeatures),
      },
      {
        id: "linkedin",
        title: "LinkedIn Features",
        icon: "tabler/brand-linkedin",
        labels: linkedInFeaturesLabels,
        defaults: defaultLinkedInFeatures,
        t1Data: parseFeatures(tool1.linkedinFeatures, defaultLinkedInFeatures),
        t2Data: parseFeatures(tool2.linkedinFeatures, defaultLinkedInFeatures),
      },
    ],
    [tool1, tool2],
  )

  // Filter and process the data
  const processedData = useMemo(() => {
    return categories
      .map(category => {
        // If both tools have marked this category as N/A, skip it entirely
        // Use type assertion since we know these might be records
        const t1Na = (category.t1Data as unknown as Record<string, unknown>)._notApplicable
        const t2Na = (category.t2Data as unknown as Record<string, unknown>)._notApplicable
        if (t1Na && t2Na) return { ...category, rows: [] }

        // Skip empty categories if desired, or let them render
        const rows = Object.entries(category.labels)
          .map(([key, labelData]) => {
            if (key === "_notApplicable") return null

            const val1 = (category.t1Data as unknown as Record<string, unknown>)[key]
            const val2 = (category.t2Data as unknown as Record<string, unknown>)[key]

            const str1 = normalizeValue(val1)
            const str2 = normalizeValue(val2)

            const isDifferent = str1 !== str2 && !(str1 === "-" && str2 === "-")
            const isCommon = str1 === str2 && str1 !== "-"

            return {
              key,
              label: labelData.label,
              description: labelData.description,
              val1: str1,
              val2: str2,
              isDifferent,
              isCommon,
            }
          })
          .filter(Boolean) as Array<{
          key: string
          label: string
          description: string
          val1: string
          val2: string
          isDifferent: boolean
          isCommon: boolean
        }>

        // Filter based on state toggles
        const filteredRows = rows.filter(row => {
          // Search filter (trimmed and lowercased)
          const q = searchQuery.trim().toLowerCase()
          if (
            q &&
            !row.label.toLowerCase().includes(q) &&
            !row.description?.toLowerCase().includes(q)
          ) {
            return false
          }
          // Hide common filter
          if (hideCommon && row.isCommon) {
            return false
          }
          // Also hide rows where both are "-" (empty/not set) unless we are searching specifically
          if (!searchQuery && row.val1 === "-" && row.val2 === "-") {
            return false
          }
          return true
        })

        return {
          ...category,
          rows: filteredRows,
        }
      })
      .filter(cat => cat.rows.length > 0)
  }, [categories, searchQuery, hideCommon])

  return (
    <div className="flex flex-col gap-6" id="comparison-table">
      {/* Table Controls (Search and Toggles - Not sticky) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm">
        <div className="relative w-full sm:w-72">
          <Icon
            name="lucide/search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search features (e.g., API)"
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Switch checked={highlightDifferences} onCheckedChange={setHighlightDifferences} />
            <span className="text-sm font-medium">Highlight Differences</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Switch checked={hideCommon} onCheckedChange={setHideCommon} />
            <span className="text-sm font-medium">Hide Common Features</span>
          </label>
        </div>
      </div>

      {/* The Unified Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Sticky Table Header Row (Tool Names and CTAs) */}
        <div className="sticky top-[var(--header-height,64px)] z-30 grid grid-cols-[1fr_1fr] md:grid-cols-[2fr_1.5fr_1.5fr] gap-2 md:gap-4 p-3 md:p-4 border-b bg-card rounded-t-xl shadow-sm">
          <div className="hidden md:flex items-center font-medium text-sm text-muted-foreground">
            Features / Specs
          </div>

          {/* Tool 1 Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaviconImage src={tool1.faviconUrl} title={tool1.name} className="size-5 shrink-0" />
              <span className="font-semibold truncate text-sm md:text-base">{tool1.name}</span>
            </div>
            <Button asChild size="sm" variant="cta" className="w-full text-xs h-8">
              <ExternalLink href={tool1.affiliateUrl || tool1.websiteUrl}>
                Visit {tool1.name}{" "}
                <Icon name="lucide/arrow-up-right" className="ml-1 size-3 hidden md:inline-block" />
              </ExternalLink>
            </Button>
          </div>

          {/* Tool 2 Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaviconImage src={tool2.faviconUrl} title={tool2.name} className="size-5 shrink-0" />
              <span className="font-semibold truncate text-sm md:text-base">{tool2.name}</span>
            </div>
            <Button asChild size="sm" variant="cta" className="w-full text-xs h-8">
              <ExternalLink href={tool2.affiliateUrl || tool2.websiteUrl}>
                Visit {tool2.name}{" "}
                <Icon name="lucide/arrow-up-right" className="ml-1 size-3 hidden md:inline-block" />
              </ExternalLink>
            </Button>
          </div>
        </div>

        {/* Categories and Rows */}
        {processedData.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No features match your current filters.
          </div>
        ) : (
          <div className="flex flex-col">
            {processedData.map(category => (
              <div key={category.id} className="flex flex-col">
                {/* Category Header */}
                <div className="sticky top-[96px] md:top-[88px] z-20 flex items-center gap-2 bg-muted/95 p-4 border-b border-t first:border-t-0 backdrop-blur-md shadow-sm">
                  <Icon name={category.icon as any} className="size-4 text-primary" />
                  <h3 className="font-semibold">{category.title}</h3>
                </div>

                {/* Rows */}
                <div className="flex flex-col divide-y">
                  {category.rows.map(row => (
                    <div
                      key={row.key}
                      className={`
                        grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr] gap-2 md:gap-4 p-4 transition-colors
                        ${highlightDifferences && row.isDifferent ? "bg-primary/5" : ""}
                        ${highlightDifferences && !row.isDifferent && searchQuery === "" ? "opacity-60 hover:opacity-100" : ""}
                      `}
                    >
                      {/* Feature Label (Col 1) */}
                      <div className="flex flex-col justify-center">
                        <span className="font-medium text-sm">{row.label}</span>
                        {row.description && (
                          <span className="text-xs text-muted-foreground">{row.description}</span>
                        )}
                      </div>

                      {/* Tool 1 Value (Col 2) */}
                      <div className="flex md:items-center py-2 md:py-0 overflow-hidden">
                        <span className="md:hidden text-xs text-muted-foreground w-32 shrink-0">
                          {tool1.name}:
                        </span>
                        <TableCellValue value={row.val1} />
                      </div>

                      {/* Tool 2 Value (Col 3) */}
                      <div className="flex md:items-center py-2 md:py-0 overflow-hidden">
                        <span className="md:hidden text-xs text-muted-foreground w-32 shrink-0">
                          {tool2.name}:
                        </span>
                        <TableCellValue value={row.val2} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
