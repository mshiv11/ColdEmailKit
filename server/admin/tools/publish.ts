import { ToolStatus } from "@prisma/client"
import { revalidatePath, revalidateTag } from "next/cache"
import { submitToIndexNow } from "~/services/indexnow"
import { notifySubmitterOfToolPublished } from "~/lib/notifications"
import { indexTools } from "~/lib/indexing"
import { getPostLaunchTemplate, sendSocialPost } from "~/lib/socials"
import type { ToolOne } from "~/server/web/tools/payloads"
import { db } from "~/services/db"

export const executePublishSideEffects = async (toolId: string, shouldNotifySubmitter: boolean = true) => {
  // Fetch full tool payload needed for side effects
  const tool = await db.tool.findUnique({
    where: { id: toolId },
  })

  if (!tool || tool.status !== ToolStatus.Published) {
    return
  }

  // 1. Notify submitter
  // notification lib checks if submitterEmail exists
  if (shouldNotifySubmitter) {
    await notifySubmitterOfToolPublished(tool).catch(console.error)
  }

  // 2. Sync to Meilisearch
  await indexTools({ where: { id: tool.id } }).catch(console.error)

  // 3. Social posting
  try {
    const template = getPostLaunchTemplate(tool)
    await sendSocialPost(template, tool)
  } catch (err) {
    console.error("Failed to make social post", err)
  }

  // 4. IndexNow submission
  if (tool.slug) {
    await submitToIndexNow([`https://coldemailkit.com/tools/${tool.slug}`]).catch(console.error)
  }

  // 5. Cache/Tag revalidation
  revalidatePath("/admin/tools")
  revalidatePath("/tools")
  revalidatePath(`/tools/${tool.slug}`)
  revalidateTag(`tool-${tool.slug}`)
}
