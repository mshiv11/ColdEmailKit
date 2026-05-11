import { formatDate, getReadTime, isTruthy } from "@primoui/utils"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense, cache } from "react"
import { H6 } from "~/components/common/heading"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import {
  AlternativePreview,
  AlternativePreviewSkeleton,
} from "~/components/web/alternatives/alternative-preview"
import { ExternalLink } from "~/components/web/external-link"
import { InlineMenu } from "~/components/web/inline-menu"
import { MDX } from "~/components/web/mdx"
import { ShareButtons } from "~/components/web/share-buttons"
import { Author } from "~/components/web/ui/author"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { FaviconImage } from "~/components/web/ui/favicon"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { metadataConfig } from "~/config/metadata"
import { generateArticleSchema, jsonLdScriptProps, wrapInGraph } from "~/lib/schemas"
import { findTool } from "~/server/web/tools/queries"
import { db } from "~/services/db"

type PageProps = {
  params: Promise<{ slug: string }>
}

const findPostBySlug = cache(async ({ params }: PageProps) => {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      tools: { select: { slug: true } }
    }
  })

  if (!post) {
    notFound()
  }

  return post
})

export const generateStaticParams = async () => {
  const posts = await db.blogPost.findMany({ select: { slug: true } })
  return posts.map((post) => ({ slug: post.slug }))
}

export const generateMetadata = async (props: PageProps): Promise<Metadata> => {
  const post = await findPostBySlug(props)
  const url = `/blog/${post.slug}`

  // Generate keywords for blog post
  const keywords = [
    post.title,
    ...post.tools.map(t => t.slug),
    "cold email",
    "email outreach",
    "cold email tools",
    "email marketing",
  ]

  return {
    title: post.title,
    description: post.description,
    keywords,
    alternates: { ...metadataConfig.alternates, canonical: url },
    openGraph: {
      ...metadataConfig.openGraph,
      url,
      type: "article",
      images: post.imageUrl
        ? [{ url: post.imageUrl, width: 1200, height: 630, alt: post.title }]
        : undefined,
      ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
    },
  }
}

export default async function BlogPostPage(props: PageProps) {
  const post = await findPostBySlug(props)
  const tools = await Promise.all(post.tools.map(t => findTool({ where: { slug: t.slug } })) ?? [])

  // Generate Article JSON-LD schema for SEO
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description || "",
    slug: post.slug,
    image: post.imageUrl || undefined,
    publishedAt: post.publishedAt.toISOString(),
    author: {
      name: post.authorName,
      twitterHandle: post.authorTwitter || undefined,
      image: post.authorImage || undefined,
    },
    wordCount: post.content.split(/\s+/).length,
    section: "Cold Email Tools",
  })

  const jsonLd = wrapInGraph(articleSchema)

  return (
    <>
      <Breadcrumbs
        items={[
          {
            href: "/blog",
            name: "Blog",
          },
          {
            href: `/blog/${post.slug}`,
            name: post.title,
          },
        ]}
      />

      <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
        <Intro>
          <IntroTitle>{post.title}</IntroTitle>
          <IntroDescription>{post.description}</IntroDescription>

          <Stack size="sm" className="mt-2" asChild>
            <Note>
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()} className="">
                  {formatDate(post.publishedAt.toISOString())}
                </time>
              )}
              <span>&bull;</span>
              <span>{getReadTime(post.content)} min read</span>
            </Note>
          </Stack>
        </Intro>

        <Section>
          <Section.Content>
            {post.imageUrl && (
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto aspect-video object-cover rounded-lg"
              />
            )}

            <MDX code={post.content} />

            <ShareButtons title={post.title} />
          </Section.Content>

          <Section.Sidebar>
            <Suspense fallback={<AdCardSkeleton className="max-md:hidden" />}>
              <AdCard where={{ type: "BlogPost" }} className="max-md:hidden" />
            </Suspense>

            <Stack direction="column" className="lg:mx-5">
              <H6 as="strong" className="text-muted-foreground">
                Written by
              </H6>

              <ExternalLink
                href={`https://twitter.com/${post.authorTwitter || "coldemailkit"}`}
                className="group"
              >
                <Author
                  name={post.authorName}
                  image={post.authorImage || undefined}
                  title={`@${post.authorTwitter || "coldemailkit"}`}
                />
              </ExternalLink>
            </Stack>

            <InlineMenu
              items={tools.filter(isTruthy).map(({ slug, name, faviconUrl }) => ({
                id: slug,
                title: name,
                prefix: <FaviconImage src={faviconUrl} title={name} className="size-4" />,
              }))}
              className="flex-1 mx-5 max-md:hidden"
            />
          </Section.Sidebar>
        </Section>
      </div>

      <Suspense fallback={<AlternativePreviewSkeleton />}>
        <AlternativePreview />
      </Suspense>

      {/* JSON-LD Article Schema for SEO */}
      <script {...jsonLdScriptProps(jsonLd)} />
    </>
  )
}
