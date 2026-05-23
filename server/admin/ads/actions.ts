"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { adminProcedure } from "~/lib/safe-actions"
import { adFormSchema } from "~/server/admin/ads/schema"
import { db } from "~/services/db"

export const upsertAd = adminProcedure
  .createServerAction()
  .input(adFormSchema.extend({ id: z.string().optional() }))
  .handler(async ({ input: { id, ...input } }) => {
    const isUpdate = !!id

    if (isUpdate) {
      const ad = await db.ad.update({
        where: { id },
        data: input,
      })

      revalidateTag("ads")
      revalidatePath("/admin/ads")

      return ad
    }

    const ad = await db.ad.create({
      data: input,
    })

    revalidateTag("ads")
    revalidatePath("/admin/ads")

    return ad
  })

export const deleteAds = adminProcedure
  .createServerAction()
  .input(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ input: { ids } }) => {
    await db.ad.deleteMany({
      where: { id: { in: ids } },
    })

    revalidateTag("ads")
    revalidatePath("/admin/ads")

    return true
  })
