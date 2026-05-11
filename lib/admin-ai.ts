import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { generateObject, generateText, streamObject } from "ai"
import type { ZodType } from "zod"
import { env } from "~/env"
import { getErrorMessage } from "~/lib/handle-error"
import {
  type ScrapedWebsiteData,
  scrapeWebsiteDataWithFallback,
  searchWebData,
} from "~/lib/scraper"
import { comparisonSchema, contentSchema, descriptionSchema } from "~/server/admin/shared/schema"
import { getUrlHostname } from "~/utils/helpers"

type StructuredObjectOptions<RESULT> = {
  schema: ZodType<RESULT>
  system: string
  prompt: string
  temperature: number
  maxOutputTokens?: number
}

type MistralChatResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string
          }>
    }
  }>
}

export const adminCompletionModels = [
  "gemini-flash-lite-latest",
  "gemini-2.0-flash-lite-001",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash-lite-preview-02-05",
] as const

export const defaultAdminCompletionModel = adminCompletionModels[0]

const TOOL_CONTENT_SYSTEM_PROMPT = `You are a senior cold email strategist and outreach consultant writing for ColdEmailKit.com. You have 10+ years of hands-on experience running outbound campaigns, managing SDR teams, and evaluating every cold email tool on the market.

You write the way a seasoned outreach professional talks to their team about a tool they have personally tested. Your voice is direct, experienced, and practical. You do not use marketing fluff. You do not hedge. You tell it like it is.

Do not use em-dash. Do not use en-dash. Do not use words like "streamline", "empower", "leverage", "robust", "cutting-edge", or "game-changer". Write like a human professional, not a marketer.

Your readers are SDRs, sales leaders, agency owners, and growth operators who are evaluating this tool for real outbound campaigns. They want to know: Does this tool actually work? What does it do better than alternatives? Where does it fall short? What is the real cost?

You MUST only state facts that appear in the source data provided to you. Do not invent pricing, features, integrations, or capabilities that are not explicitly mentioned in the scraped website content or search results. If specific pricing is not available in the data, say "check their website for current pricing" instead of making up numbers.

FORMATTING RULES:
- Every sentence MUST be its own paragraph. Put a blank line after every single sentence. No exceptions.
- Never write two sentences in the same paragraph. Each thought gets its own breathing room.
- Use "-" (hyphen) for all bullet points. Never use "." or special bullet characters.
- Use standard Markdown only. No MDX, no JSX, no HTML tags.
- Use one blank line between every section.
- Use "---" for horizontal rules.

CONTENT STRUCTURE (follow this exact order):

1. OPENING SECTION (no heading, just plain text):
   Three sentences, each as its own paragraph with blank lines between them.
   - Sentence 1: What this tool is and what problem it solves for outreach teams
   - Sentence 2: The specific workflow it enables and what makes it different from other tools in this space
   - Sentence 3: Who should actually consider this tool and at what price point

### Top Features

5 to 8 bullet points. Each bullet must start with "-". Each bullet is a short, specific, factual phrase pulled directly from the source data. No full sentences. No vague language.

### Pricing

Two to four sentences, each as its own paragraph. Cover the pricing tiers, plan names, and what each includes. Only include pricing details that are explicitly stated in the source data. If pricing is not available, state that clearly.

ADDITIONAL SECTIONS:
- Use ## for major sections and ### for subsections
- Every sentence must be its own paragraph
- Do not repeat anything already covered in the opening, Top Features, or Pricing
- Do not repeat pricing information in any other section
- Write from the perspective of someone who has used this tool in real campaigns. Use language like "In practice...", "What this means for your outreach...", "The key thing to know here is..."
- Include internal links where relevant using the format [anchor text](/tools/tool-slug) when the topic relates to another cold email tool
- Optimize section headings for featured snippets: use clear, question-based or topic-based headings that match what SDRs actually search for

---

## Frequently Asked Questions

End every page with exactly 7 FAQ entries. Each FAQ must be formatted as:

### 1. [Question text]

[Answer text: 2 to 4 sentences, each as its own paragraph. Be specific and direct. Answer the way an experienced outreach professional would answer a colleague.]

### 2. [Question text]

[Answer text]

(Continue numbering through ### 7.)

CRITICAL FAQ RULES:
- Extract FAQ questions from the search results data provided. Look for "People Also Ask" patterns, common search queries, comparison questions, and pre-purchase concerns.
- Prioritize questions that an SDR or sales leader would actually ask before buying.
- Structure each answer to target featured snippets: lead with a direct answer in the first sentence, then elaborate.
- Each question must be a numbered ### heading (### 1., ### 2., etc.)
- Each answer must have each sentence as a separate paragraph below the heading.
- Questions should address: setup time, learning curve, deliverability impact, pricing vs value, how it compares to specific competitors by name, integration requirements, support responsiveness, and realistic campaign outcomes.

Before the FAQ section, add a horizontal rule using: ---

You will receive:
- The tool name
- Live crawled content from the tool's own website
- Search results showing what currently ranks for this tool's keywords

Use all of this to write content that is accurate, current, and written with the authority of someone who lives and breathes cold outreach every day. Every claim must be traceable to the source data provided.`

const DESCRIPTION_SYSTEM_PROMPT = `
      You are an expert content creator specializing in reasearching and writing about software.
      Your task is to generate high-quality, engaging content to display on a directory website.
      DO NOT use catchphrases like "Empower", "Streamline" etc.
    `

const getMistralContent = (response: MistralChatResponse) => {
  const rawContent = response.choices?.[0]?.message?.content

  if (typeof rawContent === "string") {
    return rawContent
  }

  if (Array.isArray(rawContent)) {
    return rawContent.map(part => part.text ?? "").join("")
  }

  throw new Error("Mistral returned an empty response.")
}

const generateObjectWithAnthropic = async <RESULT>({
  schema,
  system,
  prompt,
  temperature,
  maxOutputTokens,
}: StructuredObjectOptions<RESULT>) => {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema,
    system,
    prompt,
    temperature,
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
  })

  return object
}

const generateObjectWithMistral = async <RESULT>({
  schema,
  system,
  prompt,
  temperature,
  maxOutputTokens,
}: StructuredObjectOptions<RESULT>) => {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature,
      ...(maxOutputTokens ? { max_tokens: maxOutputTokens } : {}),
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as MistralChatResponse
  const content = getMistralContent(data)
  const parsed = JSON.parse(content)

  return schema.parse(parsed)
}

const generateStructuredObjectWithFallback = async <RESULT>(
  options: StructuredObjectOptions<RESULT>,
) => {
  try {
    return await generateObjectWithAnthropic(options)
  } catch (anthropicError) {
    console.error("Anthropic generation failed, falling back to Mistral:", anthropicError)

    let retries = 3
    let mistralError: any

    while (retries > 0) {
      try {
        return await generateObjectWithMistral(options)
      } catch (err: any) {
        mistralError = err
        if (err.message && err.message.includes("429")) {
          console.error("Mistral 429 Rate Limit. Waiting 10s before retry...")
          await new Promise(r => setTimeout(r, 10000))
          retries--
        } else {
          break // Stop retrying if it's not a 429
        }
      }
    }

    console.error("Mistral fallback failed completely:", mistralError)
    throw new Error(
      `Generation failed with both Anthropic and Mistral. Anthropic: ${getErrorMessage(
        anthropicError,
      )} Mistral: ${getErrorMessage(mistralError)}`,
    )
  }
}

const buildScrapedDescriptionPrompt = (url: string, scrapedData: ScrapedWebsiteData) => {
  const truncatedContent = scrapedData.content.slice(0, 8000)

  return `Provide me details for the following website URL: ${url}.

Page Title: ${scrapedData.title || "Unknown"}
Meta Description: ${scrapedData.description || "No description"}
Website Content:
${truncatedContent || "No website content available."}`
}

export const generateAdminToolContent = async ({
  url,
  name,
}: {
  url: string
  name?: string
}) => {
  const toolName = name || getUrlHostname(url)

  let searchData = ""
  try {
    searchData = await searchWebData(`${toolName} review features pricing alternatives`)
  } catch (searchError) {
    console.error("Jina Search error (continuing without search data):", searchError)
  }

  let scrapedData: ScrapedWebsiteData | null = null
  try {
    scrapedData = await scrapeWebsiteDataWithFallback(url)
  } catch (scrapeError) {
    console.error("Website scraping failed:", scrapeError)
  }

  if (!searchData && !scrapedData) {
    throw new Error(
      "Failed to gather data from both search and website scraping. Please check your FIRECRAWL_API_KEY in Railway and your Jina API balance, then try again.",
    )
  }

  const truncatedContent = scrapedData?.content?.slice(0, 15000) || ""
  const truncatedSearchData = searchData.slice(0, 15000)

  return generateStructuredObjectWithFallback({
    schema: contentSchema,
    system: TOOL_CONTENT_SYSTEM_PROMPT,
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
  })
}

export const streamAdminToolContent = async ({
  url,
  name,
}: {
  url: string
  name?: string
}) => {
  const toolName = name || getUrlHostname(url)

  let searchData = ""
  try {
    searchData = await searchWebData(`${toolName} review features pricing alternatives`)
  } catch (searchError) {
    console.error("Jina Search error (continuing without search data):", searchError)
  }

  let scrapedData: ScrapedWebsiteData | null = null
  try {
    scrapedData = await scrapeWebsiteDataWithFallback(url)
  } catch (scrapeError) {
    console.error("Website scraping failed:", scrapeError)
  }

  if (!searchData && !scrapedData) {
    throw new Error(
      "Failed to gather data from both search and website scraping. Please check your FIRECRAWL_API_KEY in Railway and your Jina API balance, then try again.",
    )
  }

  const truncatedContent = scrapedData?.content?.slice(0, 15000) || ""
  const truncatedSearchData = searchData.slice(0, 15000)

  return streamObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: contentSchema,
    system: TOOL_CONTENT_SYSTEM_PROMPT,
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
  })
}

export const generateAdminAlternativeDescription = async ({ url }: { url: string }) => {
  let scrapedData: ScrapedWebsiteData | null = null

  try {
    scrapedData = await scrapeWebsiteDataWithFallback(url)
  } catch (scrapeError) {
    console.error("Description grounding failed (continuing with URL-only prompt):", scrapeError)
  }

  return generateStructuredObjectWithFallback({
    schema: descriptionSchema,
    system: DESCRIPTION_SYSTEM_PROMPT,
    temperature: 0.3,
    maxOutputTokens: 5000,
    prompt: scrapedData
      ? buildScrapedDescriptionPrompt(url, scrapedData)
      : `Provide me details for the following website URL: ${url}.`,
  })
}

const COMPARISON_SYSTEM_PROMPT = `You are an expert copywriter for ColdEmailKit, focused on writing highly analytical and definitive side-by-side programmatic software comparisons. Your task is to extract all meaningful differences between the two provided tools and synthesize them into the requested JSON schema.
Write in a factual, neutral, and helpful tone. Do not use generic marketing language. Do not use em-dash or en-dash. Always rewrite in your own voice. Make definitive statements based on facts.`

export const generateComparisonContent = async ({
  tool1,
  tool2,
}: { tool1: string; tool2: string }) => {
  const [data1, data2] = await Promise.all([
    searchWebData(`site:coldemailkit.com ${tool1} review OR what is ${tool1}`),
    searchWebData(`site:coldemailkit.com ${tool2} review OR what is ${tool2}`),
  ])

  const prompt = `Tool 1: ${tool1}\nData 1:\n${data1}\n\nTool 2: ${tool2}\nData 2:\n${data2}\n\nPlease compare these two tools by generating the required fields.`

  return generateStructuredObjectWithFallback({
    schema: comparisonSchema,
    system: COMPARISON_SYSTEM_PROMPT,
    prompt,
    temperature: 0.1,
  })
}

export const streamComparisonContent = async ({
  tool1,
  tool2,
}: { tool1: string; tool2: string }) => {
  const [data1, data2] = await Promise.all([
    searchWebData(`site:coldemailkit.com ${tool1} review OR what is ${tool1}`),
    searchWebData(`site:coldemailkit.com ${tool2} review OR what is ${tool2}`),
  ])

  const prompt = `Tool 1: ${tool1}\nData 1:\n${data1}\n\nTool 2: ${tool2}\nData 2:\n${data2}\n\nPlease compare these two tools by generating the required fields.`

  return streamObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: comparisonSchema,
    system: COMPARISON_SYSTEM_PROMPT,
    prompt,
    temperature: 0.1,
  })
}

export const generateAdminCompletion = async ({
  prompt,
  model,
}: {
  prompt: string
  model: string
}) => {
  const { text } = await generateText({
    model: google(model),
    prompt,
    maxOutputTokens: 300,
  })

  return text
}
