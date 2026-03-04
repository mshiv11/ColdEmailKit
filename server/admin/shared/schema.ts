import { z } from "zod"

/**
 * The schema for the content generator.
 * Produces structured content with Key Features, Pros and Cons, and Pricing sections.
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
    `Detailed Markdown-formatted content for the full tool page, following this exact structure:

1. OPENING SECTION — exactly three sentences:
   - Sentence 1: What the tool is, its rating or reputation if available, and its primary use case
   - Sentence 2: What the tool specifically does — features, workflow, and outcomes
   - Sentence 3: Who it is best suited for and the starting price

2. TOP FEATURES — with an H2 heading, bullet points only, no sentences, no descriptions, 5 to 8 bullets maximum

3. PRICING SECTION — with an H2 heading, two to four sentences covering the pricing tiers, what each includes, and where to get the best deal. No bullet points.

4. ADDITIONAL SECTIONS — based on the search data provided, write the remaining sections that match the search intent for this tool using H2 and H3 headings. Do not repeat anything already covered. Follow the natural outline from search results.

Do not use em-dash. Write in a factual, neutral, helpful tone. Do not copy sentences from sources — always rewrite in your own voice.`,
  ),
})

/**
 * The schema for the description generator.
 */
export const descriptionSchema = contentSchema.pick({ description: true })
