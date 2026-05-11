import { z } from "zod"

/**
 * The schema for the content generator.
 * Produces structured content with Opening, Top Features (H3), Pricing (H3), Additional Sections, and search-derived FAQ.
 */
export const contentSchema = z.object({
  tagline: z
    .string()
    .describe(
      "A compelling tagline (max 60 chars) that captures the tool's unique value proposition. Avoid tool name, focus on benefits.",
    ),
  description: z
    .string()
    .describe(
      "A meta description (one sentence, under 160 characters) that includes the tool name and its core value proposition.",
    ),
  content: z.string().describe(
    `Detailed Markdown-formatted content for the full tool page. Use one blank line between every section. Use "-" for all bullet points, never "." or special characters. Follow this exact structure:

1. OPENING SECTION (no heading):
   Exactly three sentences covering what the tool is, what it does, and who it is for with starting price.

### Top Features
5 to 8 bullet points using "-". Short factual phrases only.

### Pricing
Two to four sentences with specific plan names and prices. No bullet points.

Additional ## and ### sections based on search data. Do not repeat opening, features, or pricing content.

---

## Frequently Asked Questions
Exactly 7 FAQ entries. Each question is a numbered ### heading (### 1., ### 2., etc.) followed by a 2-4 sentence answer paragraph. Questions must be extracted from search results data, targeting real search intent and featured snippets.

Do not use em-dash or en-dash. Write in a factual, neutral, helpful tone. Always rewrite in your own voice.`,
  ),
})

/**
 * The schema for the description generator.
 */
export const descriptionSchema = contentSchema.pick({ description: true })

/**
 * The schema for generating full programmatic comparisons.
 */
export const comparisonSchema = z.object({
  customTitle: z
    .string()
    .describe("SEO optimized title. Format strictly as 'Tool A vs Tool B: Full Comparison (2026)'"),
  customDescription: z
    .string()
    .describe(
      "Compelling meta description. Max 160 characters. Highlight exact use-cases where one wins over the other.",
    ),
  overviewContent: z
    .string()
    .describe(
      "Markdown formatted. 3-4 paragraphs summarizing the philosophical and structural differences between the two tools. Do not include Top Features or Pricing as there is already a table for that. Focus on UX, architecture, and core audiences.",
    ),
  verdict: z
    .string()
    .describe(
      "Markdown formatted. 2 paragraphs making a definitive, unapologetic verdict on who should choose which tool and why. Do not be perfectly neutral - make a strong, guided recommendation based on team size, need, or budget.",
    ),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .describe("List of exactly 3-5 frequently asked questions comparing these two specific tools."),
})
