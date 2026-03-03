"use client"

import type { Review } from "@prisma/client"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { useServerAction } from "zsa-react"
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
import { deleteReviews } from "~/server/admin/reviews/actions"

type ReviewsDeleteDialogProps = ComponentProps<typeof Dialog> & {
    reviews: Review[]
    showTrigger?: boolean
    onSuccess?: () => void
}

export const ReviewsDeleteDialog = ({
    reviews,
    showTrigger = true,
    onSuccess,
    ...props
}: ReviewsDeleteDialogProps) => {
    const { execute, isPending } = useServerAction(deleteReviews, {
        onSuccess: () => {
            props.onOpenChange?.(false)
            toast.success("Reviews deleted")
            onSuccess?.()
        },

        onError: ({ err }) => {
            toast.error(err.message)
        },
    })

    return (
        <Dialog {...props}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button variant="secondary" size="md" prefix={<Icon name="lucide/trash" />}>
                        Delete ({reviews.length})
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your{" "}
                        <span className="font-medium">{reviews.length}</span>
                        {reviews.length === 1 ? " review" : " reviews"} and recalculate affected tool ratings.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button size="md" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        aria-label="Delete selected rows"
                        size="md"
                        variant="destructive"
                        className="min-w-28"
                        onClick={() => execute({ ids: reviews.map(({ id }) => id) })}
                        isPending={isPending}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
