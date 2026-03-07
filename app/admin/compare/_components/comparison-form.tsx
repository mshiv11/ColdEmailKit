"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import { H2, H3 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { CollapsibleSection } from "~/components/admin/collapsible-section"
import {
  upsertComparisonFaq,
  deleteComparisonFaq,
  updateToolComparisonDescription,
  deleteAllComparisonFaqs,
  revalidateComparison,
} from "~/server/admin/comparisons/actions"

type Tool = {
  id: string
  name: string
  slug: string
  faviconUrl: string | null
  comparisonDescription?: string | null
}

type FaqEntry = {
  id?: string
  question: string
  answer: string
  order: number
}

type ComparisonFormProps = {
  tool1: Tool
  tool2: Tool
  existingFaqs: FaqEntry[]
}

export function ComparisonForm({ tool1, tool2, existingFaqs }: ComparisonFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [desc1, setDesc1] = useState(tool1.comparisonDescription ?? "")
  const [desc2, setDesc2] = useState(tool2.comparisonDescription ?? "")
  const [faqs, setFaqs] = useState<FaqEntry[]>(existingFaqs)
  const [newQ, setNewQ] = useState("")
  const [newA, setNewA] = useState("")

  const handleSaveDescriptions = () => {
    startTransition(async () => {
      const [r1, r2] = await Promise.all([
        updateToolComparisonDescription({ toolId: tool1.id, comparisonDescription: desc1 || null }),
        updateToolComparisonDescription({ toolId: tool2.id, comparisonDescription: desc2 || null }),
      ])
      if (r1[1] || r2[1]) {
        toast.error("Failed to save descriptions")
      } else {
        toast.success("Descriptions saved")
        router.refresh()
      }
    })
  }

  const handleAddFaq = () => {
    if (!newQ.trim() || !newA.trim()) {
      toast.error("Both question and answer are required")
      return
    }
    startTransition(async () => {
      const [result, error] = await upsertComparisonFaq({
        tool1Id: tool1.id,
        tool2Id: tool2.id,
        question: newQ.trim(),
        answer: newA.trim(),
        order: faqs.length,
      })
      if (error) {
        toast.error("Failed to add FAQ")
      } else {
        toast.success("FAQ added")
        setNewQ("")
        setNewA("")
        setFaqs(prev => [...prev, { id: result?.id, question: newQ.trim(), answer: newA.trim(), order: faqs.length }])
        router.refresh()
      }
    })
  }

  const handleDeleteFaq = (id: string) => {
    startTransition(async () => {
      const [, error] = await deleteComparisonFaq({ id })
      if (error) {
        toast.error("Failed to delete FAQ")
      } else {
        toast.success("FAQ deleted")
        setFaqs(faqs.filter(f => f.id !== id))
        router.refresh()
      }
    })
  }

  const handleDeleteComparison = () => {
    if (!confirm(`Are you sure you want to delete the entire ${tool1.name} vs ${tool2.name} comparison? This will remove all FAQs and descriptions.`)) {
      return
    }
    startTransition(async () => {
      // Delete all FAQs
      const [, faqError] = await deleteAllComparisonFaqs({ tool1Id: tool1.id, tool2Id: tool2.id })
      if (faqError) {
        toast.error("Failed to delete comparison")
        return
      }
      // Clear comparison descriptions
      await Promise.all([
        updateToolComparisonDescription({ toolId: tool1.id, comparisonDescription: null }),
        updateToolComparisonDescription({ toolId: tool2.id, comparisonDescription: null }),
      ])
      toast.success("Comparison deleted")
      router.push("/admin/compare")
      router.refresh()
    })
  }

  const handleRevalidate = () => {
    startTransition(async () => {
      const [, error] = await revalidateComparison({ slug1: tool1.slug, slug2: tool2.slug })
      if (error) {
        toast.error("Failed to revalidate")
      } else {
        toast.success("Comparison page revalidated — changes will appear shortly")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Preview Link + Revalidate */}
      <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
        <Icon name="lucide/globe" className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Preview:</span>
        <a
          href={`/compare/${tool1.slug}-vs-${tool2.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          /compare/{tool1.slug}-vs-{tool2.slug}
        </a>
        <Icon
          name="lucide/arrow-up-right"
          className="size-3.5 text-muted-foreground"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRevalidate}
          disabled={isPending}
          className="ml-auto"
        >
          {isPending ? <Icon name="lucide/loader" className="animate-spin size-4" /> : <Icon name="lucide/refresh-cw" className="size-4" />}
          Revalidate
        </Button>
      </div>

      {/* Comparison Descriptions — Collapsible */}
      <CollapsibleSection title="Comparison Descriptions" description="Optional comparison-specific overrides for each tool's description on the comparison page. Leave blank to use the tool's main description." defaultOpen={true}>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{tool1.name} description</label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                placeholder={`Custom description for ${tool1.name} on the comparison page…`}
                value={desc1}
                onChange={e => setDesc1(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{tool2.name} description</label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                placeholder={`Custom description for ${tool2.name} on the comparison page…`}
                value={desc2}
                onChange={e => setDesc2(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSaveDescriptions} disabled={isPending} className="self-start">
            {isPending ? <Icon name="lucide/loader" className="animate-spin size-4" /> : null}
            Save Descriptions
          </Button>
        </div>
      </CollapsibleSection>

      {/* FAQs — Collapsible */}
      <CollapsibleSection title="FAQs" fieldCount={faqs.length} defaultOpen={true}>
        <div className="flex flex-col gap-6">
          {/* Existing FAQs */}
          {faqs.length > 0 && (
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => (
                <div key={faq.id ?? idx} className="rounded-lg border bg-card p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <H3 className="text-sm font-medium">{faq.question}</H3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0 -mt-1"
                      onClick={() => faq.id && handleDeleteFaq(faq.id)}
                      disabled={isPending}
                    >
                      <Icon name="lucide/trash" className="size-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add new FAQ */}
          <div className="rounded-lg border border-dashed p-4 flex flex-col gap-3">
            <H3 className="text-sm font-medium">Add a new FAQ</H3>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-medium">Question</label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Which tool has better deliverability?"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-medium">Answer</label>
              <textarea
                className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                placeholder="Write a detailed answer…"
                value={newA}
                onChange={e => setNewA(e.target.value)}
              />
            </div>
            <Button onClick={handleAddFaq} disabled={isPending} className="self-start">
              {isPending ? <Icon name="lucide/loader" className="animate-spin size-4" /> : null}
              <Icon name="lucide/plus" className="size-4" />
              Add FAQ
            </Button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Danger Zone */}
      <div className="flex flex-col gap-4 rounded-lg border border-destructive/30 p-4">
        <H2 className="text-lg text-destructive">Danger Zone</H2>
        <p className="text-sm text-muted-foreground">
          Deleting this comparison will remove all FAQs and comparison descriptions for{" "}
          <strong>{tool1.name}</strong> vs <strong>{tool2.name}</strong>. The individual tool pages will not be affected.
        </p>
        <Button
          variant="destructive"
          onClick={handleDeleteComparison}
          disabled={isPending}
          className="self-start"
        >
          {isPending ? <Icon name="lucide/loader" className="animate-spin size-4" /> : null}
          <Icon name="lucide/trash" className="size-4" />
          Delete Comparison
        </Button>
      </div>
    </div>
  )
}
