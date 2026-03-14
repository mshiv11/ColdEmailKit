import { Link } from "~/components/common/link"
import { Listing } from "~/components/web/listing"
import { Grid } from "~/components/web/ui/grid"
import { Card, CardHeader, CardFooter } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Skeleton } from "~/components/common/skeleton"
import { findCategories } from "~/server/web/categories/queries"
import plur from "plur"

const CategoryPreview = async () => {
  const categories = await findCategories({ where: { parentId: null }, take: 6 })

  if (!categories.length) {
    return null
  }

  return (
    <Listing
      title="Browse by Category:"
      button={<Link href="/categories">View all categories</Link>}
      separated
    >
      <Grid>
        {categories.map(category => (
          <Card key={category.slug} asChild>
            <Link href={`/categories/${category.fullPath}`}>
              <CardHeader wrap={false}>

                <H4 as="h3" className="truncate">
                  {category.label || category.name}
                </H4>
              </CardHeader>

              <CardFooter className="mt-auto">
                {category._count.tools} {plur("tool", category._count.tools)}
              </CardFooter>
            </Link>
          </Card>
        ))}
      </Grid>
    </Listing>
  )
}

const CategoryPreviewSkeleton = () => {
  return (
    <Listing title="Browse by Category:">
      <Grid>
        {[...Array(6)].map((_, index) => (
          <Card key={index} hover={false} className="items-stretch select-none">
            <CardHeader>

              <H4 className="w-2/3">
                <Skeleton>&nbsp;</Skeleton>
              </H4>
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-1/3">&nbsp;</Skeleton>
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </Listing>
  )
}

export { CategoryPreview, CategoryPreviewSkeleton }
