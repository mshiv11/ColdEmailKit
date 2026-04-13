import { notFound } from "next/navigation"
import { ToolStatus } from "@prisma/client"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { H1 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { ComparisonForm } from "../_components/comparison-form"
import { findPairFaqs, findComparisonData } from "~/server/admin/comparisons/queries"
import { db } from "~/services/db"

type PageProps = {
  params: Promise<{ slug: string }>
}

const ComparisonEditPage = async ({ params }: PageProps) => {
  const { slug } = await params
  const vsIndex = slug.indexOf("-vs-")
  if (vsIndex === -1) notFound()

  const slug1 = slug.slice(0, vsIndex)
  const slug2 = slug.slice(vsIndex + 4)

  // Look up tools by slug instead of ID
  const [tool1Full, tool2Full] = await Promise.all([
    db.tool.findFirst({
      where: { slug: slug1, status: ToolStatus.Published },
      select: { id: true, name: true, slug: true, faviconUrl: true },
    }),
    db.tool.findFirst({
      where: { slug: slug2, status: ToolStatus.Published },
      select: { id: true, name: true, slug: true, faviconUrl: true },
    }),
  ])

  if (!tool1Full || !tool2Full) notFound()

  const [existingFaqs, existingComparisonData] = await Promise.all([
    findPairFaqs(tool1Full.id, tool2Full.id),
    findComparisonData(tool1Full.id, tool2Full.id),
  ])

  return (
    <Wrapper size="md">
      <ComparisonForm
        tool1={tool1Full}
        tool2={tool2Full}
        existingVerdict={existingComparisonData.verdict}
        existingCustomTitle={existingComparisonData.customTitle}
        existingCustomDescription={existingComparisonData.customDescription}
        existingOverviewContent={existingComparisonData.overviewContent}
        existingTool1Description={existingComparisonData.tool1Description}
        existingTool2Description={existingComparisonData.tool2Description}
        existingStatus={existingComparisonData.status as any}
        existingFaqs={existingFaqs.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          order: f.order,
        }))}
      />
    </Wrapper>
  )
}

export default withAdminPage(ComparisonEditPage)
