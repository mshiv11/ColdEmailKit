/**
 * Single source of truth for the "Best for" audience segments.
 *
 * The admin toggles, the API and the public pages all read from this list,
 * so what is ticked in the admin dashboard is exactly what renders on the site.
 * `Tool.bestFor` is stored as a comma separated string of these labels.
 */
export const BEST_FOR_OPTIONS = [
  "Solopreneurs",
  "Agencies",
  "Freelancers",
  "Recruiters",
  "Enterprises",
  "Small businesses",
] as const

export type BestForOption = (typeof BEST_FOR_OPTIONS)[number]

/** Legacy / free-text spellings mapped onto the canonical options. */
const BEST_FOR_ALIASES: Record<string, BestForOption> = {
  solopreneur: "Solopreneurs",
  "solo founders": "Solopreneurs",
  agency: "Agencies",
  freelancer: "Freelancers",
  recruiter: "Recruiters",
  enterprise: "Enterprises",
  "small business": "Small businesses",
  "small businesses": "Small businesses",
  smb: "Small businesses",
  smbs: "Small businesses",
}

const toCanonical = (raw: string): BestForOption | undefined => {
  const key = raw.trim().toLowerCase()
  if (!key) return undefined

  return BEST_FOR_OPTIONS.find(option => option.toLowerCase() === key) ?? BEST_FOR_ALIASES[key]
}

/**
 * Parse a stored `bestFor` string into canonical options.
 * Tolerates stray spaces, casing and legacy spellings, drops unknown values,
 * removes duplicates and returns the options in toggle order.
 */
export const parseBestFor = (value?: string | null): BestForOption[] => {
  if (!value) return []

  const selected = new Set(
    value
      .split(",")
      .map(toCanonical)
      .filter((option): option is BestForOption => !!option),
  )

  return BEST_FOR_OPTIONS.filter(option => selected.has(option))
}

/** Serialize options for storage in `Tool.bestFor`. */
export const serializeBestFor = (options: readonly string[]): string => {
  return parseBestFor(options.join(",")).join(",")
}

/** Normalize any incoming `bestFor` value (API, imports) for storage. */
export const normalizeBestFor = (value?: string | null): string => {
  return parseBestFor(value).join(",")
}

/** Human readable label for public pages, or null when nothing is selected. */
export const formatBestFor = (value?: string | null): string | null => {
  const options = parseBestFor(value)
  return options.length ? options.join(", ") : null
}
