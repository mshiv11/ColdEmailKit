"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { calculateProprietaryRating, formDataToRatingInput } from "~/lib/rating-algorithm"
import { adminProcedure } from "~/lib/safe-actions"
import { db } from "~/services/db"

export const deleteReviews = adminProcedure
  .createServerAction()
  .input(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ input: { ids } }) => {
    // Get the reviews to find which tools need rating recalculation
    const reviews = await db.review.findMany({
      where: { id: { in: ids } },
      select: { toolId: true },
    })

    const affectedToolIds = [...new Set(reviews.map(r => r.toolId))]

    // Delete the reviews
    await db.review.deleteMany({
      where: { id: { in: ids } },
    })

    // Recalculate ratings for each affected tool
    for (const toolId of affectedToolIds) {
      const aggregation = await db.review.aggregate({
        where: { toolId },
        _avg: { rating: true },
        _count: { rating: true },
      })

      const coldEmailKitRating = Math.round((aggregation._avg.rating ?? 0) * 100) / 100
      const coldEmailKitReviews = aggregation._count.rating

      const tool = await db.tool.findUniqueOrThrow({
        where: { id: toolId },
        select: {
          slug: true,
          g2Rating: true,
          g2Reviews: true,
          trustpilotRating: true,
          trustpilotReviews: true,
          capterraRating: true,
          capterraReviews: true,
          trustradiusRating: true,
          trustradiusReviews: true,
        },
      })

      const ratingInput = formDataToRatingInput({
        g2Rating: tool.g2Rating ?? 0,
        g2Reviews: tool.g2Reviews ?? 0,
        trustpilotRating: tool.trustpilotRating ?? 0,
        trustpilotReviews: tool.trustpilotReviews ?? 0,
        capterraRating: tool.capterraRating ?? 0,
        capterraReviews: tool.capterraReviews ?? 0,
        trustradiusRating: tool.trustradiusRating ?? 0,
        trustradiusReviews: tool.trustradiusReviews ?? 0,
        coldEmailKitRating,
        coldEmailKitReviews,
      })

      const result = calculateProprietaryRating(ratingInput)

      await db.tool.update({
        where: { id: toolId },
        data: {
          coldEmailKitRating,
          coldEmailKitReviews,
          overallRating: result.proprietaryRating,
          totalReviews: result.totalReviews,
          trustScore: result.trustScore,
        },
      })

      revalidateTag(`tool-${tool.slug}`)
      revalidatePath(`/tools/${tool.slug}`)
    }

    revalidatePath("/admin/reviews")

    return true
  })
