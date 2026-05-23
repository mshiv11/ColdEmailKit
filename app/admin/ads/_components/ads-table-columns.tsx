"use client"

import { formatDate } from "@primoui/utils"
import type { Ad } from "@prisma/client"
import type { ColumnDef } from "@tanstack/react-table"
import { AdActions } from "./ad-actions"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Note } from "~/components/common/note"
import { Badge } from "~/components/common/badge"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableLink } from "~/components/data-table/data-table-link"

export const getColumns = (): ColumnDef<Ad>[] => {
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
      accessorKey: "name",
      enableHiding: false,
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <DataTableLink href={`/admin/ads/${row.original.id}`} title={row.original.name} />
      ),
    },
    {
      accessorKey: "type",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
      cell: ({ row }) => <Badge variant="soft">{row.original.type}</Badge>,
    },
    {
      accessorKey: "displayPages",
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Target Pages" />,
      cell: ({ row }) => {
        const pages = row.original.displayPages
        if (!pages || !pages.length) return <Note className="text-xs">Global (All)</Note>
        return (
          <div className="flex flex-wrap gap-1">
            {pages.map(page => (
              <Badge key={page} variant="outline" className="text-xs capitalize">
                {page}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      id: "status",
      size: 100,
      header: "Status",
      cell: ({ row }) => {
        const ad = row.original
        const now = new Date()
        const starts = new Date(ad.startsAt)
        const ends = new Date(ad.endsAt)

        if (now < starts) {
          return (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/15">
              Scheduled
            </Badge>
          )
        }
        if (now > ends) {
          return (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15">
              Expired
            </Badge>
          )
        }
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15">
            Active
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
      cell: ({ cell }) => <Note>{formatDate(cell.getValue() as Date)}</Note>,
    },
    {
      id: "actions",
      cell: ({ row }) => <AdActions ad={row.original} className="float-right" />,
    },
  ]
}
