import type { ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { Prose } from "~/components/common/prose"
import { MDXComponents } from "~/components/web/mdx-components"

type ComparisonMarkdownProps = ComponentProps<typeof Prose> & {
  code: string
}

export const ComparisonMarkdown = ({ code, ...props }: ComparisonMarkdownProps) => {
  return (
    <Prose {...props}>
      <ReactMarkdown
        components={MDXComponents}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {code}
      </ReactMarkdown>
    </Prose>
  )
}
