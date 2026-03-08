import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findReviews } from "~/server/admin/reviews/queries"
import { reviewsTableParamsCache } from "~/server/admin/reviews/schema"
import { ReviewsTable } from "./_components/reviews-table"

type ReviewsPageProps = {
  searchParams: Promise<SearchParams>
}

const ReviewsPage = async ({ searchParams }: ReviewsPageProps) => {
  const search = reviewsTableParamsCache.parse(await searchParams)
  const reviewsPromise = findReviews(search)

  return (
    <Suspense fallback={<DataTableSkeleton title="Reviews" />}>
      <ReviewsTable reviewsPromise={reviewsPromise} />
    </Suspense>
  )
}

export default withAdminPage(ReviewsPage)
