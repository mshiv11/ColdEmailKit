import type { Metadata } from "next"
import { BlogTable } from "~/app/admin/blog/_components/blog-table"
import { withAdminPage } from "~/components/admin/auth-hoc"
import { Wrapper } from "~/components/admin/wrapper"
import { db } from "~/services/db"

export const metadata: Metadata = {
  title: "Blog Posts | Admin",
}

const BlogAdminPage = async () => {
  const posts = await db.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      publishedAt: true,
      authorName: true,
    }
  })

  return (
    <Wrapper size="lg">
      <BlogTable posts={posts} />
    </Wrapper>
  )
}

export default withAdminPage(BlogAdminPage)
