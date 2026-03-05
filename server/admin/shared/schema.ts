import { z } from "zod"

/**
 * The schema for the content generator.
 * Produces structured content with Opening, Top Features (H3), Pricing (H3), Additional Sections, and 7-question FAQ.
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
    `Detailed Markdown-formatted content for the full tool page. Use one blank line between every section. Follow this exact structure:

1. OPENING SECTION — exactly three sentences (no heading):
   - Sentence 1: What the tool is, its rating/reputation if available, and its primary use case
   - Sentence 2: What the tool specifically does — features, workflow, and outcomes
   - Sentence 3: Who it is best suited for and the starting price

### Top Features
Bullet points only. 5 to 8 bullets. Each bullet must be specific and factual — no vague marketing language.

### Pricing
Two to four sentences. Cover pricing tiers, plan names, what each includes, and where to find the best deal. No bullet points.

Additional ## and ### sections based on search data — do not repeat anything already in Opening, Top Features, or Pricing.

---

## Frequently Asked Questions
Exactly 7 Q&A entries in **Q:** / A: format. Topics: setup complexity, pricing value, feature comparison vs a named competitor, technical requirements, support quality, expected results/timeline, and one tool-specific friction point answered honestly.

Do not use em-dash or en-dash. Write in a factual, neutral, helpful tone. Always rewrite in your own voice.`,
  ),
})

/**
 * The schema for the description generator.
 */
export const descriptionSchema = contentSchema.pick({ description: true })
