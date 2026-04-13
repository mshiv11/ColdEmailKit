import { z } from "zod"
import { streamComparisonContent } from "~/lib/admin-ai"
import { withAdminAuth } from "~/lib/auth-hoc"
import { getErrorMessage } from "~/lib/handle-error"

export const maxDuration = 120

const generateContentSchema = z.object({
  tool1: z.string(),
  tool2: z.string(),
})

export const POST = withAdminAuth(async req => {
  try {
    const { tool1, tool2 } = generateContentSchema.parse(await req.json())
    const stream = await streamComparisonContent({ tool1, tool2 })

    return stream.toTextStreamResponse()
  } catch (error) {
    console.error("Generate comparison content API error:", error)

    return new Response(getErrorMessage(error), {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
})
