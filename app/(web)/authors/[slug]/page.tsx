import { db } from "~/services/db"
import { notFound } from "next/navigation"
import { H1, H2 } from "~/components/common/heading"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Wrapper } from "~/components/admin/wrapper"
import { Author } from "~/components/web/ui/author"
import { Markdown } from "~/components/web/markdown"
import { ToolCard } from "~/components/web/tools/tool-card"
import { toolOnePayload } from "~/server/web/tools/payloads"
import type { Metadata } from "next"

type PageProps = {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params
  const user = await db.user.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { name: true, headline: true, shortBio: true }
  })
  
  if (!user) return { title: "Author not found" }
  return {
    title: `${user.name} - ${user.headline || "Author"}`,
    description: user.shortBio || `Read tools and articles by ${user.name} on ColdEmailKit.`,
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params
  
  const user = await db.user.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      id: true,
      name: true,
      image: true,
      headline: true,
      bio: true,
      shortBio: true,
      twitterUrl: true,
      websiteUrl: true,
      tools: {
        where: { status: "Published" },
        select: toolOnePayload,
        orderBy: { createdAt: "desc" },
      }
    }
  })

  if (!user) notFound()

  return (
    <div className="container py-8 max-w-5xl mx-auto flex flex-col gap-10">
      <Breadcrumbs items={[{ name: "Authors", href: "/authors" }, { name: user.name || "Author", href: `/authors/${slug}` }]} />
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 bg-card border rounded-2xl p-8 max-w-md w-full shrink-0 shadow-sm top-8 sticky">
          <Author name={user.name || "Unknown"} image={user.image} title={user.headline || "Contributor"} className="mb-6 scale-125 transform origin-left" />
          
          <div className="text-muted-foreground prose prose-sm dark:prose-invert">
            {user.bio ? (
              <Markdown code={user.bio} />
            ) : (
              <p>{user.shortBio || "No bio available."}</p>
            )}
          </div>
          
          {(user.twitterUrl || user.websiteUrl) && (
            <div className="flex mt-8 border-t pt-6 gap-4">
              {user.twitterUrl && (
                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground hover:text-foreground">
                  Twitter
                </a>
              )}
              {user.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground hover:text-foreground">
                  Website
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 w-full shrink flex flex-col gap-12 pt-0 md:pt-4">
          <H2 className="text-2xl mt-0">Tools by {user.name}</H2>
          
          {user.tools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {user.tools.map((tool: any) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">This author hasn't published any tools yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
