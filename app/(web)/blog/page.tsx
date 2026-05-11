import type { Metadata } from "next"
import { PostCard } from "~/components/web/posts/post-card"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Grid } from "~/components/web/ui/grid"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { metadataConfig } from "~/config/metadata"
import { db } from "~/services/db"

export const metadata: Metadata = {
  title: "ColdEmailKit Blog",
  description:
    "A collection of articles reviewing cold email tools and software used by sales teams, SDRs, agencies, and enterprises for outreach campaigns.",
  openGraph: { ...metadataConfig.openGraph, url: "/blog" },
  alternates: { ...metadataConfig.alternates, canonical: "/blog" },
}

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      description: true,
      content: true,
      imageUrl: true,
      publishedAt: true,
    }
  })

  return (
    <>
      <Breadcrumbs
        items={[
          {
            href: "/blog",
            name: "Blog",
          },
        ]}
      />

      <Intro>
        <IntroTitle>{`${metadata.title}`}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      {posts.length ? (
        <Grid>
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </Grid>
      ) : (
        <p>No posts found.</p>
      )}
    </>
  )
}
