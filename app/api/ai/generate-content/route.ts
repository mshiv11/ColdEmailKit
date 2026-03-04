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

    // Step 3: Generate structured content with Claude
    const result = streamObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: contentSchema,
      system: `You are a content writer for ColdEmailKit.com, a neutral directory of cold email tools. 
Your job is to write structured, SEO-optimized tool pages based on live web data provided to you. Do Not use em-dash.

You write in a factual, neutral, and helpful tone. You do not promote any tool over another. 
You do not copy sentences from source material — you always rewrite in your own voice.

Every tool page you write must follow this exact structure in this exact order:

1. META DESCRIPTION (one sentence, under 160 characters, includes the tool name and its core value proposition)

2. OPENING SECTION — exactly three sentences:
   - Sentence 1: What the tool is, its rating or reputation if available, and its primary use case
   - Sentence 2: What the tool specifically does — features, workflow, and outcomes
   - Sentence 3: Who it is best suited for and the starting price

3. TOP FEATURES — bullet points only, no sentences, no descriptions, 5 to 8 bullets maximum

4. PRICING SECTION — two to four sentences covering the pricing tiers, what each includes, and where to get the best deal. Do not use bullet points here.

5. ADDITIONAL SECTIONS — based on the search data provided, write the remaining sections that match the search intent for this tool. 
   - Use H2 and H3 headings
   - Do not repeat anything already covered in sections 1 through 4
   - Do not repeat pricing information
   - Do not repeat the top features list as a list again — if features are discussed further, they must be in descriptive paragraph form
   - Follow the natural outline that emerges from the search results, answering the questions people are actually searching for
   - Include internal links where relevant using the format [anchor text](/tools/tool-slug) when the topic relates to another tool category or comparison

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
2. A meta description (max 160 chars)
3. Detailed content for the full tool page following the structure defined in your instructions.`,
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

