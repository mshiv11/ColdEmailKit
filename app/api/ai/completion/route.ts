import { z } from "zod"
import {
  adminCompletionModels,
  defaultAdminCompletionModel,
  generateAdminCompletion,
} from "~/lib/admin-ai"
import { withAdminAuth } from "~/lib/auth-hoc"
import { getErrorMessage } from "~/lib/handle-error"

const completionSchema = z.object({
  prompt: z.string(),
  model: z.enum(adminCompletionModels).optional().default(defaultAdminCompletionModel),
})

export const POST = withAdminAuth(async req => {
  try {
    const { prompt, model } = completionSchema.parse(await req.json())
    const completion = await generateAdminCompletion({ prompt, model })

    return new Response(completion, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("AI completion route error:", error)

    return new Response(getErrorMessage(error), {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
})
