import { ToolStatus } from "@prisma/client"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { DashboardPageProps } from "~/app/(web)/dashboard/page"
import { DashboardTable } from "~/app/(web)/dashboard/table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { auth } from "~/lib/auth"
import { findTools } from "~/server/admin/tools/queries"
import { toolsTableParamsCache } from "~/server/admin/tools/schema"

export const DashboardToolListing = async ({ searchParams }: DashboardPageProps) => {
  const parsedParams = toolsTableParamsCache.parse(await searchParams)
  const session = await auth.api.getSession({ headers: await headers() })
  const status = [ToolStatus.Draft, ToolStatus.Scheduled, ToolStatus.Published]

  if (!session?.user) {
    throw redirect("/auth/login?next=/dashboard")
  }

  // Admins manage tools via the admin panel, not the user dashboard.
  // Only show tools they explicitly own (claimed via domain verification).
  // Regular users see tools they submitted (by email) or own.
  const isAdmin = session.user.role === "admin"
  const whereFilter = isAdmin
    ? { ownerId: session.user.id }
    : { OR: [{ submitterEmail: session.user.email }, { ownerId: session.user.id }] }

  const toolsPromise = findTools(
    { ...parsedParams, status: status },
    whereFilter,
  )

  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <DashboardTable toolsPromise={toolsPromise} />
    </Suspense>
  )
}
