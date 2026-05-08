"use client"

import type { PropsWithChildren } from "react"
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
import { deleteApiKey } from "~/server/admin/api-keys/actions"
import type { ApiKeyListItem } from "~/server/admin/api-keys/queries"

type DeleteApiKeyDialogProps = PropsWithChildren<{
  apiKey: ApiKeyListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function DeleteApiKeyDialog({
  apiKey,
  children,
  open,
  onOpenChange,
}: DeleteApiKeyDialogProps) {
  const { execute, isPending } = useServerAction(deleteApiKey, {
    onSuccess: () => {
      onOpenChange(false)
      toast.success(`API key "${apiKey.name}" has been permanently deleted`)
    },
    onError: ({ err }) => {
      toast.error(err.message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to <strong>permanently delete</strong> the API key{" "}
            <strong>"{apiKey.name}"</strong> (
            <code className="text-xs">{apiKey.keyPrefix}...</code>)?
            <br />
            <br />
            This will remove the key and <strong>all usage logs</strong> forever. This action cannot
            be undone.
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
            className="min-w-28"
            onClick={() => execute({ id: apiKey.id })}
            isPending={isPending}
          >
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
