import { MDXRemote } from "next-mdx-remote/rsc"
import type { ComponentProps } from "react"
import { Prose } from "~/components/common/prose"
import { MDXComponents } from "~/components/web/mdx-components"
import { cx } from "~/utils/cva"

type MDXProps = ComponentProps<typeof Prose> & {
  code: string
  components?: Record<string, React.ComponentType<any>>
}

export const MDX = ({ className, code, components }: MDXProps) => {
  return (
    <Prose className={cx("max-w-3xl!", className)}>
      <MDXRemote source={code} components={{ ...MDXComponents, ...components }} />
    </Prose>
  )
}
