"use client"

import { useRouter } from "next/navigation"
import { type ComponentProps, useState } from "react"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import type { ComparisonPair } from "~/server/admin/comparisons/queries"
import { cx } from "~/utils/cva"
import { ComparisonsDeleteDialog } from "./comparisons-delete-dialog"

type ComparisonActionsProps = ComponentProps<typeof Button> & {
  comparison: ComparisonPair
}

export const ComparisonActions = ({ className, comparison, ...props }: ComparisonActionsProps) => {
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

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/compare/${comparison.slug}`}>Edit</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/compare/${comparison.slug}`} target="_blank">
            View
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => setIsDeleteOpen(true)} className="text-red-500">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ComparisonsDeleteDialog
        open={isDeleteOpen}
        onOpenChange={() => setIsDeleteOpen(false)}
        comparison={comparison}
        showTrigger={false}
        onSuccess={() => router.push("/admin/compare")}
      />
    </DropdownMenu>
  )
}
