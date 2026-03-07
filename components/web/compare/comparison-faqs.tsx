"use client"

import { useState } from "react"
import { Icon } from "~/components/common/icon"
import { H2 } from "~/components/common/heading"
import { FAQSchema } from "~/components/web/seo/faq-schema"
import type { ComparisonFaqItem } from "~/server/web/comparisons/payloads"

type ComparisonFaqsProps = {
  faqs: ComparisonFaqItem[]
  tool1Name: string
  tool2Name: string
}

/**
 * Accordion FAQ section for tool comparison pages.
 * Also renders FAQPage JSON-LD schema for SEO.
 */
export function ComparisonFaqs({ faqs, tool1Name, tool2Name }: ComparisonFaqsProps) {
  if (!faqs.length) return null

  return (
    <div className="flex flex-col gap-6">
      <H2 className="text-xl">
        {tool1Name} vs {tool2Name}: Frequently Asked Questions
      </H2>

      <div className="space-y-3">
        {faqs.map(faq => (
          <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
        ))}
      </div>

      <FAQSchema faqs={faqs} />
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-medium text-sm">{question}</span>
        <Icon
          name={open ? "lucide/chevron-up" : "lucide/chevron-down"}
          className="size-4 text-muted-foreground shrink-0"
        />
      </button>

      {open && (
        <div className="px-4 py-4 text-sm text-muted-foreground leading-relaxed border-t">
          {answer}
        </div>
      )}
    </div>
  )
}
