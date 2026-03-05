import { google } from "@ai-sdk/google"
import { streamObject } from "ai"
import { z } from "zod"
import { withAdminAuth } from "~/lib/auth-hoc"
import { scrapeWebsiteData, searchWebData } from "~/lib/scraper"
import { contentSchema } from "~/server/admin/shared/schema"

export const maxDuration = 60

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
      model: google("gemini-2.5-pro-preview-05-06"),
      schema: contentSchema,
      system: `You are a content writer for ColdEmailKit.com, a neutral directory of cold email tools.
Your job is to write structured, SEO-optimized tool pages based on live web data provided to you. Do not use em-dash. Do not use en-dash.

You write in a factual, neutral, and helpful tone. You do not promote any tool over another.
You do not copy sentences from source material — you always rewrite in your own voice.

Your goal is to create the definitive resource about this tool. Someone who reads this page top-to-bottom should feel fully informed and ready to make a decision. Write content that is perspective-shifting: surface non-obvious facts, clarify common misconceptions, and answer the questions people actually have before signing up.

Every tool page you write must follow this exact structure in this exact order, with one blank line between every section:

2. OPENING SECTION — exactly three sentences:
   - Sentence 1: What the tool is, its rating or reputation if available, and its primary use case
   - Sentence 2: What the tool specifically does — features, workflow, and outcomes
   - Sentence 3: Who it is best suited for and the starting price

### Top Features
Bullet points only. No sentences inside bullets. No descriptions. 5 to 8 bullets maximum. Make each bullet specific and factual — avoid vague marketing language.

### Pricing
Two to four sentences covering the pricing tiers, what each includes, and where to get the best deal. Do not use bullet points here. Be specific with plan names and prices if available from the source data.

5. ADDITIONAL SECTIONS — based on the search data provided, write the remaining sections that match the search intent for this tool.
   - Use ## and ### headings
   - Do not repeat anything already covered in the opening section, Top Features, or Pricing
   - Do not repeat pricing information
   - Do not repeat the Top Features list again — if features are discussed further, they must be in descriptive paragraph form
   - Follow the natural outline that emerges from the search results, answering the questions people are actually searching for
   - Include internal links where relevant using the format [anchor text](/tools/tool-slug) when the topic relates to another tool category or comparison
   - Add one blank line between every section heading and its content, and one blank line between sections

---

## Frequently Asked Questions

End every page with exactly 7 FAQ entries in this exact Markdown format:

**Q: [Question]**
A: [Answer — 2 to 4 sentences. Be specific. Do not hedge. If you do not know exact details, give the most likely answer based on typical tools in this category.]

The 7 questions must cover these topics in this order:
1. Setup or implementation — how easy or complex is getting started?
2. Pricing or value — is it worth the cost compared to alternatives?
3. Feature comparison — how does a specific key feature compare to a named competitor?
4. Technical requirements or compatibility — what do you need to use this tool effectively?
5. Support and onboarding — what help is available and how fast is it?
6. Results or outcomes — what realistic results should a new user expect, and in what timeframe?
7. A tool-specific friction point — the most common hesitation or complaint about this tool, answered directly and honestly

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
2. A meta description (max 160 chars) — one sentence, includes tool name and core value
3. Detailed content for the full tool page following the structure defined in your instructions. Remember: ### for Top Features and Pricing, ## for additional sections, end with --- then 7 FAQ questions.`,
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

