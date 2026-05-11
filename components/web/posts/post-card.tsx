import { formatDate, getReadTime } from "@primoui/utils"
import Image from "next/image"
import type { ComponentProps } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Link } from "~/components/common/link"

export type PartialBlogPost = {
  slug: string
  title: string
  description: string | null
  content: string
  imageUrl: string | null
  publishedAt: Date
}

type PostCardProps = ComponentProps<typeof Card> & {
  post: PartialBlogPost
}

export const PostCard = ({ className, post, ...props }: PostCardProps) => {
  return (
    <Card className="overflow-clip" asChild {...props}>
      <Link href={`/blog/${post.slug}`}>
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={1200}
            height={630}
            className="-m-4 mb-0 w-[calc(100%+2rem)] rounded-t-md max-w-none aspect-video object-cover"
          />
        )}

        <CardHeader wrap={false}>
          <H4 as="h3" className="leading-snug!">
            {post.title}
          </H4>
        </CardHeader>

        {post.description && <CardDescription>{post.description}</CardDescription>}

        {post.publishedAt && (
          <CardFooter>
            <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt.toISOString())}</time>
            <span>&bull;</span>
            <span>{getReadTime(post.content)} min read</span>
          </CardFooter>
        )}
      </Link>
    </Card>
  )
}
