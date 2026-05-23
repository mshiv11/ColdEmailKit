import { notFound } from "next/navigation"
import { AdForm } from "../_components/ad-form"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { findAdById } from "~/server/admin/ads/queries"

type PageProps = {
  params: Promise<{ id: string }>
}

const UpdateAdPage = async ({ params }: PageProps) => {
  const { id } = await params
  const ad = await findAdById(id)

  if (!ad) {
    return notFound()
  }

  return (
    <Wrapper size="md">
      <AdForm
        title="Update advertisement"
        ad={ad}
      />
    </Wrapper>
  )
}

export default withAdminPage(UpdateAdPage)
