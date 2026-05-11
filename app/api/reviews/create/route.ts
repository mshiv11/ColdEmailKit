import { revalidatePath, revalidateTag } from "next/cache"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "~/lib/auth"
import { calculateProprietaryRating, formDataToRatingInput } from "~/lib/rating-algorithm"
import { db } from "~/services/db"

const reviewSchema = z.object({
  toolId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const { toolId, rating, comment } = reviewSchema.parse(json)

    // Check if user already reviewed this tool
    const existingReview = await db.review.findFirst({
      where: {
        userId: session.user.id,
        toolId,
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this tool" }, { status: 400 })
    }

    // Create the review
    const review = await db.review.create({
      data: {
        userId: session.user.id,
        toolId,
        rating,
        comment,
      },
    })

    // Recalculate aggregate ratings for this tool
    const aggregation = await db.review.aggregate({
      where: { toolId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    const coldEmailKitRating = Math.round((aggregation._avg.rating ?? 0) * 100) / 100
    const coldEmailKitReviews = aggregation._count.rating

    // Fetch the tool's current platform ratings to recalculate overall rating
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

    // Calculate proprietary rating using the existing algorithm
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

    // Update the tool with new aggregate data
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

    // Revalidate caches so the product page reflects new data
    revalidateTag(`tool-${tool.slug}`)
    revalidatePath(`/tools/${tool.slug}`)
    revalidatePath("/admin/reviews")

    return NextResponse.json(review)
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
