import { z } from "zod"
import { streamAdminToolContent } from "~/lib/admin-ai"
import { withAdminAuth } from "~/lib/auth-hoc"
import { getErrorMessage } from "~/lib/handle-error"

export const maxDuration = 120

const generateContentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
})

export const POST = withAdminAuth(async req => {
  try {
    const { url, name } = generateContentSchema.parse(await req.json())
    const stream = await streamAdminToolContent({ url, name })

    return stream.toTextStreamResponse()
  } catch (error) {
    console.error("Generate content API error:", error)

    return new Response(getErrorMessage(error), {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
})
