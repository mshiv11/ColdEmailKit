"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { FaviconImage } from "~/components/web/ui/favicon"
import { Link } from "~/components/common/link"
import { ComparisonActions } from "./comparison-actions"
import type { ComparisonPair } from "~/server/admin/comparisons/queries"

export const getColumns = (): ColumnDef<ComparisonPair>[] => {
  return [
    {
      accessorKey: "slug",
      enableHiding: false,
      size: 260,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const { tool1, tool2, slug } = row.original
        return (
          <Link
            href={`/admin/compare/${slug}`}
            className="flex items-center gap-2 font-medium text-sm hover:text-primary transition-colors"
          >
            <FaviconImage src={tool1.faviconUrl} title={tool1.name} className="size-5 shrink-0" />
            <span className="truncate">{tool1.name}</span>
            <span className="text-muted-foreground text-xs">vs</span>
            <FaviconImage src={tool2.faviconUrl} title={tool2.name} className="size-5 shrink-0" />
            <span className="truncate">{tool2.name}</span>
          </Link>
        )
      },
    },
    {
      accessorKey: "faqCount",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} title="FAQs" />,
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.faqCount} FAQ{row.original.faqCount !== 1 ? "s" : ""}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
      cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
    },
    {
      id: "actions",
      cell: ({ row }) => <ComparisonActions comparison={row.original} className="float-right" />,
    },
  ]
}
