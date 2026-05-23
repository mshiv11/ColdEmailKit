import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { AdForm } from "../_components/ad-form"

const NewAdPage = async () => {
  return (
    <Wrapper size="md">
      <AdForm title="New advertisement" />
    </Wrapper>
  )
}

export default withAdminPage(NewAdPage)
