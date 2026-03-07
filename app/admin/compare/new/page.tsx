import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { H1 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { findAllPublishedTools } from "~/server/admin/comparisons/queries"
import { NewComparisonForm } from "./_components/new-comparison-form"

const NewComparisonPage = async () => {
  const tools = await findAllPublishedTools()

  return (
    <Wrapper>
      <div className="flex items-center gap-3">
        <Link href="/admin/compare" className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="lucide/arrow-left" className="size-4" />
        </Link>
        <H1>New Comparison</H1>
      </div>

      <NewComparisonForm tools={tools} />
    </Wrapper>
  )
}

export default withAdminPage(NewComparisonPage)
