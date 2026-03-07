import { notFound } from "next/navigation"
import { ToolStatus } from "@prisma/client"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { H1 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { FaviconImage } from "~/components/web/ui/favicon"
import { ComparisonForm } from "../_components/comparison-form"
import { findPairFaqs } from "~/server/admin/comparisons/queries"
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
      select: { id: true, name: true, slug: true, faviconUrl: true, comparisonDescription: true },
    }),
    db.tool.findFirst({
      where: { slug: slug2, status: ToolStatus.Published },
      select: { id: true, name: true, slug: true, faviconUrl: true, comparisonDescription: true },
    }),
  ])

  if (!tool1Full || !tool2Full) notFound()

  const existingFaqs = await findPairFaqs(tool1Full.id, tool2Full.id)

  return (
    <Wrapper>
      <div className="flex items-center gap-3">
        <Link
          href="/admin/compare"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="lucide/arrow-left" className="size-4" />
        </Link>
        <div className="flex items-center gap-3">
          <FaviconImage src={tool1Full.faviconUrl} title={tool1Full.name} className="size-5" />
          <H1 as="h1" className="text-xl">
            {tool1Full.name} vs {tool2Full.name}
          </H1>
          <FaviconImage src={tool2Full.faviconUrl} title={tool2Full.name} className="size-5" />
        </div>
      </div>

      <ComparisonForm
        tool1={tool1Full}
        tool2={tool2Full}
        existingFaqs={existingFaqs.map(f => ({
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
