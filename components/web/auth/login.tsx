import { LoginButton } from "~/components/web/auth/login-button"
import { LoginForm } from "~/components/web/auth/login-form"

import { Stack } from "~/components/common/stack"

export const Login = () => {
  return (
    <Stack direction="column" className="items-stretch w-full">
      <LoginForm />

      <div className="relative flex items-center gap-3 my-1">
        <div className="flex-1 border-t" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t" />
      </div>

      <LoginButton provider="google" />
    </Stack>
  )
}
