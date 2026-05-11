"use client"

import { formatDate } from "@primoui/utils"
import { useState } from "react"
import { toast } from "sonner"
import { useServerAction } from "zsa-react"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/common/dialog"
import { H3 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { deleteBlogPost } from "~/server/admin/blog/actions"

export type BlogTableRow = {
  slug: string
  title: string
  publishedAt: Date
  authorName: string
}

type BlogTableProps = {
  posts: BlogTableRow[]
}

export function BlogTable({ posts }: BlogTableProps) {
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  const deleteAction = useServerAction(deleteBlogPost, {
    onSuccess: () => {
      toast.success("Blog post deleted")
      setDeletingSlug(null)
      // Page will revalidate
    },
    onError: ({ err }) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <Stack className="justify-between">
        <H3>Blog Posts ({posts.length})</H3>
        <Button variant="primary" size="md" prefix={<Icon name="lucide/plus" />} asChild>
          <Link href="/admin/blog/new">
            <span className="max-sm:sr-only">New post</span>
          </Link>
        </Button>
      </Stack>

      <div className="rounded-lg border divide-y">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No blog posts found. Create your first post!
          </div>
        ) : (
          posts.map(post => (
            <div key={post.slug} className="flex items-center justify-between gap-4 p-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/blog/${post.slug}`}
                  className="font-medium hover:underline truncate block"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <Note>{formatDate(post.publishedAt.toISOString())}</Note>
                  <Note>by {post.authorName}</Note>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Icon name="lucide/external-link" className="size-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/admin/blog/${post.slug}`}>Edit</Link>
                </Button>

                <Dialog
                  open={deletingSlug === post.slug}
                  onOpenChange={open => !open && setDeletingSlug(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeletingSlug(post.slug)}
                    >
                      <Icon name="lucide/trash" className="size-4 text-red-500" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete blog post?</DialogTitle>
                      <DialogDescription>
                        This will permanently delete <strong>"{post.title}"</strong> from your blog.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button size="md" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>

                      <Button
                        size="md"
                        variant="destructive"
                        onClick={() => deleteAction.execute({ slug: post.slug })}
                        isPending={deleteAction.isPending}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
