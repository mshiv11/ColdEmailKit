"use client"

import { useState, useMemo } from "react"
import { Markdown } from "~/components/web/markdown"
import { Icon } from "~/components/common/icon"
import { H2 } from "~/components/common/heading"
import { cx } from "~/utils/cva"

type MarkdownWithFAQProps = {
  code: string
  className?: string
}

type ParsedFAQ = {
  question: string
  answer: string
}

/**
 * Enhanced Markdown component that detects FAQ sections
 * (## Frequently Asked Questions) in MDX content and renders
 * the Q&A pairs as interactive collapsible accordions.
 *
 * The non-FAQ content is rendered using the standard Markdown component.
 */
export function MarkdownWithFAQ({ code, className }: MarkdownWithFAQProps) {
  // Split content at FAQ heading
  const { mainContent, faqs } = useMemo(() => parseFAQFromMarkdown(code), [code])

  if (!faqs.length) {
    // No FAQ section found — render normally
    return <Markdown code={code} className={className} />
  }

  return (
    <div className={cx("flex flex-col gap-8", className)}>
      {/* Render non-FAQ content normally */}
      {mainContent.trim() && <Markdown code={mainContent} />}

      {/* Render FAQ section as accordion */}
      <FAQAccordion faqs={faqs} />
    </div>
  )
}

function FAQAccordion({ faqs }: { faqs: ParsedFAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-4 w-full">
      <H2 className="text-xl">Frequently Asked Questions</H2>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
        {faqs.map((faq, index) => (
          <div key={index} className="flex flex-col">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span>{faq.question}</span>
              <Icon
                name={openIndex === index ? "lucide/chevron-up" : "lucide/chevron-down"}
                className="size-4 shrink-0 text-muted-foreground transition-transform"
              />
            </button>

            {openIndex === index && (
              <div
                className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Parses markdown content to extract FAQ section.
 * Looks for ## or <h2> heading containing "Frequently Asked Questions" (with optional trailing text),
 * then extracts ### or <h3> questions with their <p> answers.
 */
function parseFAQFromMarkdown(content: string): {
  mainContent: string
  faqs: ParsedFAQ[]
} {
  // Match the FAQ heading — flexible to allow "Frequently Asked Questions About [Tool]" etc.
  // Supports both markdown ## and HTML <h2> formats
  const faqHeadingPattern =
    /(?:^##\s+Frequently\s+Asked\s+Questions[^\n]*$|<h2[^>]*>\s*Frequently\s+Asked\s+Questions[^<]*<\/h2>)/im

  const match = content.match(faqHeadingPattern)

  if (!match || match.index === undefined) {
    return { mainContent: content, faqs: [] }
  }

  const mainContent = content.substring(0, match.index).trim()
  const faqContent = content.substring(match.index + match[0].length).trim()

  // Extract Q&A pairs - support both markdown ### and HTML <h3> formats
  const faqs: ParsedFAQ[] = []

  // Collect all h3 heading matches with their positions
  const h3Pattern = /(?:^###\s+(.+)$|<h3[^>]*>(.*?)<\/h3>)/gim
  const matches: { question: string; matchStart: number; contentStart: number }[] = []

  let h3Match: RegExpExecArray | null
  while ((h3Match = h3Pattern.exec(faqContent)) !== null) {
    const question = (h3Match[1] || h3Match[2] || "").trim()
    // Strip numbering like "1. " or "2. " from the beginning
    const cleanQuestion = question.replace(/^\d+\.\s*/, "")
    if (cleanQuestion) {
      matches.push({
        question: cleanQuestion,
        matchStart: h3Match.index,
        contentStart: h3Match.index + h3Match[0].length,
      })
    }
  }

  // Extract answers — content between the end of one h3 and the start of the next
  for (let i = 0; i < matches.length; i++) {
    const answerStart = matches[i].contentStart
    const answerEnd = i + 1 < matches.length ? matches[i + 1].matchStart : faqContent.length

    const answer = faqContent.substring(answerStart, answerEnd).trim()

    if (answer) {
      faqs.push({ question: matches[i].question, answer })
    }
  }

  return { mainContent, faqs }
}
