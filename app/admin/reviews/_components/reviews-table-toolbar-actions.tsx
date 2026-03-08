"use client"

import type { Review } from "@prisma/client"
import type { Table } from "@tanstack/react-table"
import { ReviewsDeleteDialog } from "./reviews-delete-dialog"

type ReviewsTableToolbarActionsProps = {
  table: Table<Review>
}

export function ReviewsTableToolbarActions({ table }: ReviewsTableToolbarActionsProps) {
  return (
    <>
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <ReviewsDeleteDialog
          reviews={table.getFilteredSelectedRowModel().rows.map(row => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      )}
    </>
  )
}
