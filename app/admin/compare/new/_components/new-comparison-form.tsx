"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { FaviconImage } from "~/components/web/ui/favicon"

type Tool = {
  id: string
  name: string
  slug: string
  faviconUrl: string | null
}

export function NewComparisonForm({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [tool1Id, setTool1Id] = useState("")
  const [tool2Id, setTool2Id] = useState("")

  const selectedTool1 = tools.find(t => t.id === tool1Id)
  const selectedTool2 = tools.find(t => t.id === tool2Id)

  const handleStart = () => {
    if (!selectedTool1 || !selectedTool2 || tool1Id === tool2Id) return
    router.push(`/admin/compare/${selectedTool1.slug}-vs-${selectedTool2.slug}`)
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <H2 className="text-base">Select two tools to compare</H2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tool 1</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={tool1Id}
            onChange={e => setTool1Id(e.target.value)}
          >
            <option value="">Select a tool…</option>
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          {selectedTool1 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FaviconImage src={selectedTool1.faviconUrl} title={selectedTool1.name} className="size-4" />
              {selectedTool1.name}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tool 2</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={tool2Id}
            onChange={e => setTool2Id(e.target.value)}
          >
            <option value="">Select a tool…</option>
            {tools
              .filter(t => t.id !== tool1Id)
              .map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
          </select>
          {selectedTool2 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FaviconImage src={selectedTool2.faviconUrl} title={selectedTool2.name} className="size-4" />
              {selectedTool2.name}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleStart}
        disabled={!tool1Id || !tool2Id || tool1Id === tool2Id}
        className="self-start"
      >
        Start Comparison Setup
      </Button>
    </div>
  )
}
