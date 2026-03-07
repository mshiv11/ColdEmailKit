import { Suspense } from "react"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { findAllComparisonPairs } from "~/server/admin/comparisons/queries"
import { ComparisonsTable } from "./_components/comparisons-table"

async function ComparisonsContent() {
  const comparisons = await findAllComparisonPairs()
  return <ComparisonsTable comparisons={comparisons} />
}

const ComparisonsPage = async () => {
  return (
    <Suspense fallback={<DataTableSkeleton title="Comparisons" />}>
      <ComparisonsContent />
    </Suspense>
  )
}

export default withAdminPage(ComparisonsPage)
