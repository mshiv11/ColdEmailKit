"use client"

import type { Ad } from "@prisma/client"
import { useQueryStates } from "nuqs"
import { use } from "react"
import { useMemo } from "react"
import { DateRangePicker } from "~/components/admin/date-range-picker"
import { Button } from "~/components/common/button"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import type { findAds } from "~/server/admin/ads/queries"
import { adsTableParamsSchema } from "~/server/admin/ads/schema"
import type { DataTableFilterField } from "~/types"
import { getColumns } from "./ads-table-columns"
import { AdsTableToolbarActions } from "./ads-table-toolbar-actions"

type AdsTableProps = {
  adsPromise: ReturnType<typeof findAds>
}

export function AdsTable({ adsPromise }: AdsTableProps) {
  const { ads, adsTotal, pageCount } = use(adsPromise)
  const [{ perPage, sort }] = useQueryStates(adsTableParamsSchema)

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo(() => getColumns(), [])

  // Search filters
  const filterFields: DataTableFilterField<Ad>[] = [
    {
      id: "name",
      label: "Title",
      placeholder: "Search by title...",
    },
  ]

  const { table } = useDataTable({
    data: ads,
    columns,
    pageCount,
    filterFields,
    shallow: false,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
  })

  return (
    <DataTable table={table}>
      <DataTableHeader
        title="Banners & Ads"
        total={adsTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<Icon name="lucide/plus" />} asChild>
            <Link href="/admin/ads/new">
              <div className="max-sm:sr-only">New advertisement</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <AdsTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
