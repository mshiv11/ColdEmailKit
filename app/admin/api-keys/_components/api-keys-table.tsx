"use client"

import { useState } from "react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { H3 } from "~/components/common/heading"
import { Icon } from "~/components/common/icon"
import { Stack } from "~/components/common/stack"
import type { ApiKeyListItem } from "~/server/admin/api-keys/queries"
import { CreateApiKeyDialog } from "./create-api-key-dialog"
import { DeleteApiKeyDialog } from "./delete-api-key-dialog"
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog"

type ApiKeysTableProps = {
  apiKeys: ApiKeyListItem[]
}

export function ApiKeysTable({ apiKeys }: ApiKeysTableProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <H3 as="h1">
          API Keys
          <span className="ml-1.5 opacity-40">({apiKeys.length})</span>
        </H3>

        <CreateApiKeyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <Button variant="primary" size="md" prefix={<Icon name="lucide/plus" />}>
            <div className="max-sm:sr-only">New API Key</div>
          </Button>
        </CreateApiKeyDialog>
      </div>

      {/* Table */}
      {apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border rounded-lg bg-card">
          <Icon name="lucide/shield-half" className="size-10 opacity-30" />
          <div className="text-sm text-muted-foreground">
            No API keys yet. Create one to get started.
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-accent/50">
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Key</th>
                <th className="text-left font-medium px-4 py-3">Scopes</th>
                <th className="text-left font-medium px-4 py-3">Last Used</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Requests</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(key => (
                <ApiKeyRow key={key.id} apiKey={key} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKeyListItem }) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()
  const statusVariant = apiKey.isRevoked ? "danger" : isExpired ? "warning" : "success"
  const statusLabel = apiKey.isRevoked ? "Revoked" : isExpired ? "Expired" : "Active"

  return (
    <tr className="border-b last:border-0 hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3 font-medium">{apiKey.name}</td>
      <td className="px-4 py-3">
        <code className="text-xs bg-accent px-1.5 py-0.5 rounded font-mono">
          {apiKey.keyPrefix}...
        </code>
      </td>
      <td className="px-4 py-3">
        <Stack size="xs" className="flex-wrap">
          {apiKey.scopes.slice(0, 3).map(scope => (
            <Badge key={scope} variant="outline" size="sm">
              {scope}
            </Badge>
          ))}
          {apiKey.scopes.length > 3 && (
            <Badge variant="soft" size="sm">
              +{apiKey.scopes.length - 3}
            </Badge>
          )}
        </Stack>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {apiKey.lastUsedAt
          ? new Date(apiKey.lastUsedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never"}
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusVariant} size="sm">
          {statusLabel}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{apiKey._count.logs.toLocaleString()}</td>
      <td className="px-4 py-3 text-right">
        <Stack size="xs" className="justify-end">
          {!apiKey.isRevoked && (
            <RevokeApiKeyDialog
              apiKey={apiKey}
              open={revokeDialogOpen}
              onOpenChange={setRevokeDialogOpen}
            >
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Icon name="lucide/ban" className="size-3.5" />
                <span className="max-sm:sr-only">Revoke</span>
              </Button>
            </RevokeApiKeyDialog>
          )}

          <DeleteApiKeyDialog
            apiKey={apiKey}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <Icon name="lucide/trash" className="size-3.5" />
              <span className="max-sm:sr-only">Delete</span>
            </Button>
          </DeleteApiKeyDialog>
        </Stack>
      </td>
    </tr>
  )
}
