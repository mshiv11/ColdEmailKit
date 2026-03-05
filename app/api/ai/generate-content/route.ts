import { anthropic } from "@ai-sdk/anthropic"
import { streamObject } from "ai"
import { z } from "zod"
import { withAdminAuth } from "~/lib/auth-hoc"
import { scrapeWebsiteData, searchWebData } from "~/lib/scraper"
import { contentSchema } from "~/server/admin/shared/schema"

export const maxDuration = 120

const generateContentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
})

export const POST = withAdminAuth(async req => {
  try {
    const { url, name } = generateContentSchema.parse(await req.json())

    const toolName = name || new URL(url).hostname.replace("www.", "")

    // Step 1: Jina Search — search for reviews, features, pricing, alternatives
    let searchData = ""
    try {
      searchData = await searchWebData(`${toolName} review features pricing alternatives`)
    } catch (searchError) {
      console.error("Jina Search error (continuing with reader data):", searchError)
    }

    // Step 2: Jina Reader — scrape the tool's official website
    let scrapedData: { title: string; description: string; url: string; content: string } | null =
      null
    try {
      scrapedData = await scrapeWebsiteData(url)
    } catch (scrapeError) {
      console.error("Jina Reader error (continuing with search data):", scrapeError)
    }

    // If both steps failed, return error
    if (!searchData && !scrapedData) {
      return new Response(
        JSON.stringify({
          error:
            "Failed to gather data from both search and website scraping. Please check the URL and try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    // Limit content length to prevent token overflow
    const maxContentLength = 15000
    const truncatedContent = scrapedData?.content?.slice(0, maxContentLength) || ""
    const truncatedSearchData = searchData.slice(0, 15000)

    const result = streamObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: contentSchema,
      system: `You are a content writer for ColdEmailKit.com, a neutral directory of cold email tools.
Your job is to write structured, SEO-optimized tool pages based on live web data provided to you. Do not use em-dash. Do not use en-dash.

You write in a factual, neutral, and helpful tone. You do not promote any tool over another.
You do not copy sentences from source material. You always rewrite in your own voice.

Your goal is to create the definitive resource about this tool. Someone who reads this page top-to-bottom should feel fully informed and ready to make a decision. Write content that is perspective-shifting: surface non-obvious facts, clarify common misconceptions, and answer the questions people actually have before signing up.

FORMATTING RULES:
- Use "-" (hyphen) for all bullet points. Never use "." or special bullet characters.
- Use standard Markdown only. No MDX, no JSX, no HTML tags.
- Use one blank line between every section.
- Use "---" for horizontal rules.

CONTENT STRUCTURE (follow this exact order):

1. OPENING SECTION (no heading, just plain text):
   Exactly three sentences.
   - Sentence 1: What the tool is, its rating or reputation if available, and its primary use case
   - Sentence 2: What the tool specifically does: features, workflow, and outcomes
   - Sentence 3: Who it is best suited for and the starting price

### Top Features

5 to 8 bullet points. Each bullet must start with "-". Each bullet is a short, specific, factual phrase. No full sentences. No vague marketing language.

### Pricing

Two to four sentences covering the pricing tiers, plan names, what each includes, and where to get the best deal. Do not use bullet points here. Be specific with actual plan names and prices from the source data.

ADDITIONAL SECTIONS:
- Use ## for major sections and ### for subsections
- Do not repeat anything already covered in the opening, Top Features, or Pricing
- Do not repeat pricing information in any other section
- If features are discussed further, write in paragraph form, not lists
- Follow the natural outline that emerges from the search results, answering the questions people are actually searching for
- Include internal links where relevant using the format [anchor text](/tools/tool-slug) when the topic relates to another tool
- Optimize section headings for featured snippets: use clear, question-based or topic-based headings that match search intent

---

## Frequently Asked Questions

End every page with exactly 7 FAQ entries. Each FAQ must be formatted as:

### 1. [Question text]

[Answer text: 2 to 4 sentences. Be specific and direct. Do not hedge.]

### 2. [Question text]

[Answer text]

(Continue numbering through ### 7.)

CRITICAL FAQ RULES:
- Extract FAQ questions from the search results data provided. Look for "People Also Ask" patterns, common search queries, comparison questions, and pre-purchase concerns that appear in the search results.
- Prioritize questions that reflect real search intent from the data, not generic template questions.
- Structure each answer to target featured snippets: lead with a direct answer in the first sentence, then elaborate.
- Each question must be a numbered ### heading (### 1., ### 2., etc.)
- Each answer must be a separate paragraph below the heading, not on the same line.
- Questions should address: setup/implementation, pricing/value, feature comparisons with named competitors, technical requirements, support quality, realistic outcomes, and tool-specific friction points.

Before the FAQ section, add a horizontal rule using: ---

You will receive:
- The tool name
- Live crawled content from the tool's own website
- Search results showing what currently ranks for this tool's keywords

Use all of this to write content that is accurate, current, unique, and optimized for both search intent and NLP relevance.`,
      temperature: 0.4,
      prompt: `Research and analyze this cold email tool:

Tool Name: ${toolName}
Tool Website: ${url}

--- Jina Search Results ---
${truncatedSearchData || "No search results available."}

--- Official Website Content ---
Page Title: ${scrapedData?.title || "Unknown"}
Meta Description: ${scrapedData?.description || "No description"}
Website Content:
${truncatedContent || "No website content available."}

Based on the above data, generate:
1. A compelling tagline (max 60 chars)
2. A meta description (max 160 chars) that includes the tool name and its core value
3. Detailed content for the full tool page following the structure defined in your instructions. Use "-" for all bullets. Use ### numbered headings for FAQ questions. Extract FAQ questions from the search results data.`,
      onError: error => {
        console.error("Content generation error:", error)
        throw error
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Generate content API error:", error)
    return new Response(JSON.stringify({ error: "Content generation failed. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
