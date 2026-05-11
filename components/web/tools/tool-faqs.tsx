"use client"

import { useState } from "react"
import { H2 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { cx } from "~/utils/cva"

type FAQItem = {
  question: string
  answer: string
}

type ToolFAQsProps = {
  faqs: FAQItem[]
  className?: string
}

/**
 * Visible FAQ accordion for tool pages.
 * Renders FAQ data as interactive expand/collapse items.
 */
export function ToolFAQs({ faqs, className }: ToolFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqs.length) return null

  return (
    <div className={cx("flex flex-col gap-4 w-full", className)}>
      <H2 className="text-xl">Frequently Asked Questions</H2>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
        {faqs.map((faq, index) => (
          <FAQAccordionItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  )
}

function FAQAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <Icon
          name={isOpen ? "lucide/chevron-up" : "lucide/chevron-down"}
          className="size-4 shrink-0 text-muted-foreground transition-transform"
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
      )}
    </div>
  )
}
