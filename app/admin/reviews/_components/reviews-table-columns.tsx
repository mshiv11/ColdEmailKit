"use client"

import { formatDate } from "@primoui/utils"
import type { Review, Tool, User } from "@prisma/client"
import type { ColumnDef } from "@tanstack/react-table"
import { ReviewActions } from "~/app/admin/reviews/_components/review-actions"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableLink } from "~/components/data-table/data-table-link"

export const getColumns = (): ColumnDef<Review>[] => {
  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <RowCheckbox
          checked={table.getIsAllPageRowsSelected()}
          ref={input => {
            if (input) {
              input.indeterminate =
                table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
            }
          }}
          onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <RowCheckbox
          checked={row.getIsSelected()}
          onChange={e => row.toggleSelected(e.target.checked)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "rating",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
      cell: ({ row }) => {
        const rating = row.getValue<number>("rating")
        return (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">{"★".repeat(rating)}</span>
            <span className="text-muted-foreground/30">{"★".repeat(5 - rating)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "comment",
      enableSorting: false,
      size: 320,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comment" />,
      cell: ({ row }) => <Note className="truncate">{row.getValue("comment") || "—"}</Note>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
    },
    {
      accessorKey: "user",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const user = row.getValue<Pick<User, "id" | "name">>("user")

        return (
          <DataTableLink href={`/admin/users/${user?.id}`} title={user?.name} isOverlay={false} />
        )
      },
    },
    {
      accessorKey: "tool",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tool" />,
      cell: ({ row }) => {
        const tool = row.getValue<Pick<Tool, "slug" | "name">>("tool")

        return (
          <DataTableLink href={`/admin/tools/${tool?.slug}`} title={tool?.name} isOverlay={false} />
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <ReviewActions review={row.original} className="float-right" />,
    },
  ]
}
