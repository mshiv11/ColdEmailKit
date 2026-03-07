"use client"

import { useMemo } from "react"
import { Button } from "~/components/common/button"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { useDataTable } from "~/hooks/use-data-table"
import type { ComparisonPair } from "~/server/admin/comparisons/queries"
import { getColumns } from "./comparisons-table-columns"

type ComparisonsTableProps = {
  comparisons: ComparisonPair[]
}

export function ComparisonsTable({ comparisons }: ComparisonsTableProps) {
  const columns = useMemo(() => getColumns(), [])

  const { table } = useDataTable({
    data: comparisons,
    columns,
    pageCount: 1,
    filterFields: [],
    shallow: false,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 50 },
      columnPinning: { right: ["actions"] },
    },
    getRowId: originalRow => originalRow.id,
  })

  return (
    <DataTable table={table}>
      <DataTableHeader
        title="Comparisons"
        total={comparisons.length}
        callToAction={
          <Button variant="primary" size="md" prefix={<Icon name="lucide/plus" />} asChild>
            <Link href="/admin/compare/new">
              <div className="max-sm:sr-only">New comparison</div>
            </Link>
          </Button>
        }
      />
    </DataTable>
  )
}
