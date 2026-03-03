"use client"

import type { Review } from "@prisma/client"
import { useQueryStates } from "nuqs"
import { use, useMemo } from "react"
import { DateRangePicker } from "~/components/admin/date-range-picker"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import type { findReviews } from "~/server/admin/reviews/queries"
import { reviewsTableParamsSchema } from "~/server/admin/reviews/schema"
import type { DataTableFilterField } from "~/types"
import { getColumns } from "./reviews-table-columns"
import { ReviewsTableToolbarActions } from "./reviews-table-toolbar-actions"

type ReviewsTableProps = {
    reviewsPromise: ReturnType<typeof findReviews>
}

export function ReviewsTable({ reviewsPromise }: ReviewsTableProps) {
    const { reviews, reviewsTotal, pageCount } = use(reviewsPromise)
    const [{ perPage, sort }] = useQueryStates(reviewsTableParamsSchema)

    // Memoize the columns so they don't re-render on every render
    const columns = useMemo(() => getColumns(), [])

    // Search filters
    const filterFields: DataTableFilterField<Review>[] = [
        {
            id: "comment",
            label: "Comment",
            placeholder: "Search by comment...",
        },
    ]

    const { table } = useDataTable({
        data: reviews,
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
        <>
            <DataTable table={table}>
                <DataTableHeader title="Reviews" total={reviewsTotal}>
                    <DataTableToolbar table={table} filterFields={filterFields}>
                        <ReviewsTableToolbarActions table={table} />
                        <DateRangePicker align="end" />
                        <DataTableViewOptions table={table} />
                    </DataTableToolbar>
                </DataTableHeader>
            </DataTable>
        </>
    )
}
