"use client"

import { experimental_useObject as useObject } from "@ai-sdk/react"
import { ComparisonStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { CollapsibleSection } from "~/components/admin/collapsible-section"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { H3, H5, H6 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Input } from "~/components/common/input"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { TextArea } from "~/components/common/textarea"
import { ComparisonMarkdown } from "~/components/web/comparison-markdown"
import { ExternalLink } from "~/components/web/external-link"
import { siteConfig } from "~/config/site"
import { parseAiRouteError } from "~/lib/parse-ai-route-error"
import {
  deleteAllComparisonFaqs,
  deleteComparisonFaq,
  revalidateComparison,
  upsertComparisonData,
  upsertComparisonFaq,
} from "~/server/admin/comparisons/actions"
import { comparisonSchema } from "~/server/admin/shared/schema"

type Tool = {
  id: string
  name: string
  slug: string
  faviconUrl: string | null
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
  existingVerdict: string | null
  existingCustomTitle: string | null
  existingCustomDescription: string | null
  existingOverviewContent: string | null
  existingTool1Description: string | null
  existingTool2Description: string | null
  existingStatus: ComparisonStatus
  existingFaqs: FaqEntry[]
}

export function ComparisonForm({
  tool1,
  tool2,
  existingVerdict,
  existingCustomTitle,
  existingCustomDescription,
  existingOverviewContent,
  existingTool1Description,
  existingTool2Description,
  existingStatus,
  existingFaqs,
}: ComparisonFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [desc1, setDesc1] = useState(existingTool1Description ?? "")
  const [desc2, setDesc2] = useState(existingTool2Description ?? "")
  const [verdict, setVerdict] = useState(existingVerdict ?? "")
  const [customTitle, setCustomTitle] = useState(existingCustomTitle ?? "")
  const [customDescription, setCustomDescription] = useState(existingCustomDescription ?? "")
  const [overviewContent, setOverviewContent] = useState(existingOverviewContent ?? "")
  const [status, setStatus] = useState<ComparisonStatus>(existingStatus ?? ComparisonStatus.Draft)
  const [faqs, setFaqs] = useState<FaqEntry[]>(existingFaqs)
  const [newQ, setNewQ] = useState("")
  const [newA, setNewA] = useState("")

  const handleSaveDescriptions = () => {
    startTransition(async () => {
      const [vRes, error] = await upsertComparisonData({
        tool1Id: tool1.id,
        tool2Id: tool2.id,
        verdict: verdict || null,
        customTitle: customTitle || null,
        customDescription: customDescription || null,
        overviewContent: overviewContent || null,
        tool1Description: desc1 || null,
        tool2Description: desc2 || null,
        status: status,
      })
      if (error) {
        toast.error("Failed to save descriptions and verdict")
      } else {
        toast.success("Content saved successfully")
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
        setFaqs(prev => [
          ...prev,
          { id: result?.id, question: newQ.trim(), answer: newA.trim(), order: faqs.length },
        ])
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

  const [isGenerating, setIsGenerating] = useState(false)

  const { object, submit, stop, isLoading } = useObject({
    api: "/api/ai/generate-comparison",
    schema: comparisonSchema,
    onFinish: async ({ object, error }) => {
      if (error) {
        toast.error(parseAiRouteError(error.message, "Something went wrong. Please check console."))
      } else if (object) {
        if (object.faqs && Array.isArray(object.faqs)) {
          toast.info("Saving generated FAQs...")
          const faqPromises = object.faqs.map((faq: any, idx: number) =>
            upsertComparisonFaq({
              tool1Id: tool1.id,
              tool2Id: tool2.id,
              question: faq.question,
              answer: faq.answer,
              order: faqs.length + idx,
            }),
          )
          await Promise.all(faqPromises)
          toast.success("FAQs saved automatically. Please save the comparison descriptors.")
        } else {
          toast.success("Content generated successfully. Please save the comparison to update.")
        }
        router.refresh()
      }
    },
  })

  useEffect(() => {
    if (object) {
      if (object.customTitle) setCustomTitle(object.customTitle)
      if (object.customDescription) setCustomDescription(object.customDescription)
      if (object.overviewContent) setOverviewContent(object.overviewContent)
      if (object.verdict) setVerdict(object.verdict)
      if (object.faqs && Array.isArray(object.faqs)) {
        setFaqs(object.faqs.map((q: any, i: number) => ({ ...q, order: faqs.length + i })))
      }
    }
  }, [object])

  const handleGenerateWithAI = () => {
    if (isLoading) {
      stop()
      return
    }
    submit({ tool1: tool1.name, tool2: tool2.name })
  }

  const handleDeleteComparison = () => {
    if (
      !confirm(
        `Are you sure you want to delete the entire ${tool1.name} vs ${tool2.name} comparison? This will remove all FAQs and descriptions.`,
      )
    ) {
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
      const [, error] = await upsertComparisonData({
        tool1Id: tool1.id,
        tool2Id: tool2.id,
        verdict: null,
        customTitle: null,
        customDescription: null,
        tool1Description: null,
        tool2Description: null,
      })
      if (error) {
        toast.error("Failed to delete comparison data")
        return
      }
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
        toast.success("Comparison revalidated")
        router.refresh()
      }
    })
  }

  const comparisonUrl = `/compare/${tool1.slug}-vs-${tool2.slug}`

  return (
    <Stack className="flex-col gap-6" items="stretch">
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">
          Edit {tool1.name} vs {tool2.name}
        </H3>

        <Stack size="sm" className="-my-0.5">
          <Button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={!isLoading && isPending}
            variant="secondary"
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
            prefix={
              isLoading ? (
                <Icon name="lucide/loader" className="animate-spin" />
              ) : (
                <Icon name="lucide/sparkles" />
              )
            }
          >
            {isLoading ? "Stop Generating" : "Generate Content"}
          </Button>

          <Button
            onClick={handleSaveDescriptions}
            disabled={isPending || isGenerating}
            isPending={isPending}
            variant="primary"
          >
            Save Content
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" prefix={<Icon name="lucide/ellipsis" />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={comparisonUrl} target="_blank" rel="noopener noreferrer">
                  View Comparison
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleRevalidate}>Revalidate Page</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDeleteComparison} className="text-red-500">
                Delete Comparison
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Stack>

        <Note className="w-full">
          Preview:{" "}
          <ExternalLink href={comparisonUrl} className="text-primary underline">
            {siteConfig.url}
            {comparisonUrl}
          </ExternalLink>
        </Note>
      </Stack>

      <CollapsibleSection
        title="Comparison Data (Descriptions & Verdict)"
        description="Optional comparison-specific overrides and final verdict. Leave descriptions blank to use the tool's main description."
        defaultOpen={true}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Status</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={status}
              onChange={e => setStatus(e.target.value as ComparisonStatus)}
            >
              <option value={ComparisonStatus.Draft}>Draft</option>
              <option value={ComparisonStatus.Scheduled}>Scheduled</option>
              <option value={ComparisonStatus.Published}>Published</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <label className="text-sm font-medium">Main Overview (Markdown format)</label>
            <TextArea
              className="min-h-32"
              placeholder={`Write a detailed overall comparison between ${tool1.name} and ${tool2.name}...`}
              value={overviewContent}
              onChange={e => setOverviewContent(e.target.value)}
            />
            {overviewContent && (
              <div className="mt-2 rounded-md border bg-muted/30 p-4">
                <H6 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Live Preview
                </H6>
                <ComparisonMarkdown code={overviewContent} className="text-sm border-t pt-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{tool1.name} description</label>
              <TextArea
                className="min-h-32"
                placeholder={`Custom description for ${tool1.name} on the comparison page…`}
                value={desc1}
                onChange={e => setDesc1(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{tool2.name} description</label>
              <TextArea
                className="min-h-32"
                placeholder={`Custom description for ${tool2.name} on the comparison page…`}
                value={desc2}
                onChange={e => setDesc2(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Custom SEO Title</label>
              <Input
                placeholder={`Overrides default "Tool A vs Tool B: Full Comparison"`}
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Custom SEO Description</label>
              <Input
                placeholder={`Overrides default meta description...`}
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <label className="text-sm font-medium">
              Final Verdict (Bottom of page - Markdown and URLs supported)
            </label>
            <TextArea
              className="min-h-32"
              placeholder={`Write the final verdict comparing ${tool1.name} and ${tool2.name}...`}
              value={verdict}
              onChange={e => setVerdict(e.target.value)}
            />
            {verdict && (
              <div className="mt-2 rounded-md border bg-muted/30 p-4">
                <H6 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Live Preview
                </H6>
                <ComparisonMarkdown code={verdict} className="text-sm border-t pt-2" />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="FAQs" fieldCount={faqs.length} defaultOpen={true}>
        <div className="flex flex-col gap-6">
          {faqs.length > 0 && (
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.id ?? idx}
                  className="rounded-lg border bg-card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <H6 className="text-sm font-medium">{faq.question}</H6>
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

          <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <H6 className="text-sm font-medium">Add a new FAQ</H6>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Question</label>
              <Input
                placeholder="e.g. Which tool has better deliverability?"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Answer (Markdown and URLs supported)</label>
              <TextArea
                className="min-h-24"
                placeholder="Write a detailed answer…"
                value={newA}
                onChange={e => setNewA(e.target.value)}
              />
              {newA && (
                <div className="mt-2 rounded-md border bg-muted/30 p-4">
                  <H6 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Live Preview
                  </H6>
                  <ComparisonMarkdown code={newA} className="text-sm border-t pt-2" />
                </div>
              )}
            </div>
            <Button
              onClick={handleAddFaq}
              disabled={isPending}
              isPending={isPending}
              variant="secondary"
              className="self-start"
            >
              <Icon name="lucide/plus" className="size-4" />
              Add FAQ
            </Button>
          </div>
        </div>
      </CollapsibleSection>
    </Stack>
  )
}
