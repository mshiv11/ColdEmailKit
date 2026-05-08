import { headers } from "next/headers"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { auth } from "~/lib/auth"
import { findApiKeys } from "~/server/admin/api-keys/queries"
import { ApiKeysTable } from "./_components/api-keys-table"

const ApiKeysPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  const apiKeys = await findApiKeys(session!.user.id)

  return (
    <Wrapper size="lg">
      <ApiKeysTable apiKeys={apiKeys} />
    </Wrapper>
  )
}

export default withAdminPage(ApiKeysPage)
