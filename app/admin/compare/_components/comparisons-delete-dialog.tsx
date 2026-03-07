"use client"

import type { ComponentProps } from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/common/dialog"
import { Icon } from "~/components/common/icon"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { deleteAllComparisonFaqs, updateToolComparisonDescription } from "~/server/admin/comparisons/actions"
import type { ComparisonPair } from "~/server/admin/comparisons/queries"

type ComparisonsDeleteDialogProps = ComponentProps<typeof Dialog> & {
  comparison: ComparisonPair
  showTrigger?: boolean
  onSuccess?: () => void
}

export const ComparisonsDeleteDialog = ({
  comparison,
  showTrigger = true,
  onSuccess,
  ...props
}: ComparisonsDeleteDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const [, faqError] = await deleteAllComparisonFaqs({
        tool1Id: comparison.tool1Id,
        tool2Id: comparison.tool2Id,
      })
      if (faqError) {
        toast.error("Failed to delete comparison")
        return
      }
      // Clear comparison descriptions
      await Promise.all([
        updateToolComparisonDescription({ toolId: comparison.tool1Id, comparisonDescription: null }),
        updateToolComparisonDescription({ toolId: comparison.tool2Id, comparisonDescription: null }),
      ])
      toast.success("Comparison deleted")
      props.onOpenChange?.(false)
      onSuccess?.()
      router.refresh()
    })
  }

  return (
    <Dialog {...props}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="secondary" size="md" prefix={<Icon name="lucide/trash" />}>
            Delete
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the comparison between{" "}
            <span className="font-medium">{comparison.tool1.name}</span> and{" "}
            <span className="font-medium">{comparison.tool2.name}</span>, including all FAQs and descriptions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button size="md" variant="secondary">
              Cancel
            </Button>
          </DialogClose>

          <Button
            aria-label="Delete comparison"
            size="md"
            variant="destructive"
            className="min-w-28"
            onClick={handleDelete}
            isPending={isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
