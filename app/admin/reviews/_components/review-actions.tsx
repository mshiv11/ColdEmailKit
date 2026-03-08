"use client"

import type { Review } from "@prisma/client"
import { useRouter } from "next/navigation"
import { type ComponentProps, useState } from "react"
import { ReviewsDeleteDialog } from "~/app/admin/reviews/_components/reviews-delete-dialog"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Icon } from "~/components/common/icon"
import { cx } from "~/utils/cva"

type ReviewActionsProps = ComponentProps<typeof Button> & {
  review: Review
}

export const ReviewActions = ({ review, className, ...props }: ReviewActionsProps) => {
  const router = useRouter()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open menu"
          variant="secondary"
          size="sm"
          prefix={<Icon name="lucide/ellipsis" />}
          className={cx("data-[state=open]:bg-accent", className)}
          {...props}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onSelect={() => setIsDeleteOpen(true)} className="text-red-500">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ReviewsDeleteDialog
        open={isDeleteOpen}
        onOpenChange={() => setIsDeleteOpen(false)}
        reviews={[review]}
        showTrigger={false}
        onSuccess={() => router.push("/admin/reviews")}
      />
    </DropdownMenu>
  )
}
