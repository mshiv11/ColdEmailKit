"use client"

import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { Button } from "~/components/common/button"
import { H5 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Stack } from "~/components/common/stack"
import { ToolReviewDialog } from "~/components/web/dialogs/tool-review-dialog"
import type { ToolOne } from "~/server/web/tools/payloads"
import { cx } from "~/utils/cva"

type ToolReviewsProps = {
    tool: ToolOne
    className?: string
}

function ReviewStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map(star => (
                <Icon
                    key={star}
                    name="lucide/star"
                    className={cx(
                        "size-3.5",
                        star <= rating ? "text-yellow-400 fill-current" : "text-muted-foreground/20 fill-current",
                    )}
                />
            ))}
        </div>
    )
}

export function ToolReviews({ tool, className }: ToolReviewsProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const reviews = tool.reviews ?? []

    return (
        <Stack size="lg" direction="column" className={cx("w-full", className)}>
            <div className="flex items-center justify-between w-full">
                <H5 as="strong">
                    User Reviews {reviews.length > 0 && <span className="text-muted-foreground font-normal">({reviews.length})</span>}
                </H5>

                <Button
                    size="md"
                    variant="secondary"
                    prefix={<Icon name="lucide/star" />}
                    onClick={() => setIsReviewOpen(true)}
                >
                    Write a Review
                </Button>
            </div>

            {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No reviews yet. Be the first to share your experience with {tool.name}!
                </p>
            ) : (
                <div className="grid gap-4 w-full">
                    {reviews.map(review => (
                        <div
                            key={review.id}
                            className="flex gap-3 p-4 rounded-lg border bg-card text-card-foreground"
                        >
                            {/* Avatar */}
                            <div className="shrink-0">
                                {review.user.image ? (
                                    <img
                                        src={review.user.image}
                                        alt={review.user.name}
                                        className="size-9 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                        {review.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Review Content */}
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{review.user.name}</span>
                                    <ReviewStars rating={review.rating} />
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                    </span>
                                </div>

                                {review.comment && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ToolReviewDialog tool={tool} isOpen={isReviewOpen} setIsOpen={setIsReviewOpen} />
        </Stack>
    )
}
