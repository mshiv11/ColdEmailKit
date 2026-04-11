import { z } from "zod"
import { generateAdminAlternativeDescription } from "~/lib/admin-ai"
import { withAdminAuth } from "~/lib/auth-hoc"
import { getErrorMessage } from "~/lib/handle-error"

export const maxDuration = 60

const generateContentSchema = z.object({
  url: z.string().url(),
})

export const POST = withAdminAuth(async req => {
  try {
    const { url } = generateContentSchema.parse(await req.json())
    const description = await generateAdminAlternativeDescription({ url })

    return new Response(JSON.stringify(description), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  } catch (error) {
    console.error("Generate description API error:", error)

    return new Response(getErrorMessage(error), {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
})
