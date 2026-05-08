"use client"

import { type PropsWithChildren, useState } from "react"
import { toast } from "sonner"
import { useServerAction } from "zsa-react"
import { Badge } from "~/components/common/badge"
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
import { Icon } from "~/components/common/icon"
import { VALID_SCOPES } from "~/lib/api-key-scopes"
import { createApiKey } from "~/server/admin/api-keys/actions"

type CreateApiKeyDialogProps = PropsWithChildren<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function CreateApiKeyDialog({ children, open, onOpenChange }: CreateApiKeyDialogProps) {
  const [name, setName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([...VALID_SCOPES])
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { execute, isPending } = useServerAction(createApiKey, {
    onSuccess: ({ data }) => {
      setCreatedKey(data.rawKey)
      toast.success("API key created successfully")
    },
    onError: ({ err }) => {
      toast.error(err.message)
    },
  })

  const handleSubmit = () => {
    execute({ name, scopes: selectedScopes, expiresInDays })
  }

  const handleCopy = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey)
      setCopied(true)
      toast.success("API key copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state on close
      setName("")
      setSelectedScopes([...VALID_SCOPES])
      setExpiresInDays(undefined)
      setCreatedKey(null)
      setCopied(false)
    }
    onOpenChange(isOpen)
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope],
    )
  }

  // After creation — show the raw key to copy
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Icon name="lucide/circle-check" className="size-5 text-green-500" />
                API Key Created
              </span>
            </DialogTitle>
            <DialogDescription>
              Copy this key now — <strong>it will not be shown again</strong>. Store it securely.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-accent border rounded-md px-3 py-2.5 font-mono break-all select-all">
              {createdKey}
            </code>
            <Button variant="secondary" size="md" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button size="md" variant="primary">
                Done
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key for programmatic access. The key will only be shown once after
            creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="api-key-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="api-key-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Hermes Agent"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Scopes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Scopes</label>
            <div className="flex flex-wrap gap-1.5">
              {VALID_SCOPES.map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className="cursor-pointer"
                >
                  <Badge variant={selectedScopes.includes(scope) ? "info" : "outline"} size="md">
                    {scope}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="api-key-expires" className="text-sm font-medium">
              Expiration (optional)
            </label>
            <select
              id="api-key-expires"
              value={expiresInDays ?? ""}
              onChange={e => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Never expires</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button size="md" variant="secondary">
              Cancel
            </Button>
          </DialogClose>

          <Button
            size="md"
            variant="primary"
            className="min-w-28"
            onClick={handleSubmit}
            isPending={isPending}
            disabled={!name.trim() || selectedScopes.length === 0}
          >
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
