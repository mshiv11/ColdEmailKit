import { ComparisonStatus } from "@prisma/client"
import { headers } from "next/headers"
import { env } from "~/env"
import { generateComparisonContent } from "~/lib/admin-ai"
import { getErrorMessage } from "~/lib/handle-error"
import { db } from "~/services/db"

// Note: Ensure this duration matches or exceeds the Vercel/Railway max duration
export const maxDuration = 300

export async function POST(req: Request) {
  // CRON job auth protection
  const authorization = (await headers()).get("Authorization")
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    console.log("[CRON] Starting programmatic comparison generation loop...")

    // Find up to 1 Draft comparison and try to process it
    const pair = await db.comparison.findFirst({
      where: {
        status: ComparisonStatus.Draft,
      },
      include: {
        tool1: true,
        tool2: true,
      },
      orderBy: { createdAt: "asc" },
    })

    if (!pair) {
      return new Response("No Draft comparisons found in the queue. Everything is up to date.", {
        status: 200,
      })
    }

    console.log(`[CRON] Generating AI content for: ${pair.tool1.name} vs ${pair.tool2.name}`)

    // Generate AI content
    const content = await generateComparisonContent({
      tool1: pair.tool1.name,
      tool2: pair.tool2.name,
    })

    // Upsert into memory/db
    await db.comparison.update({
      where: { id: pair.id },
      data: {
        customTitle: content.customTitle,
        customDescription: content.customDescription,
        overviewContent: content.overviewContent,
        verdict: content.verdict,
        status: ComparisonStatus.Scheduled, // Set to scheduled so it'll be published when the time is right
        publishedAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Schedule for tomorrow
      },
    })

    // Insert FAQs
    if (content.faqs && content.faqs.length > 0) {
      await Promise.all(
        content.faqs.map((faq, idx) =>
          db.comparisonFaq.upsert({
            where: {
              tool1Id_tool2Id_order: {
                tool1Id: pair.tool1Id,
                tool2Id: pair.tool2Id,
                order: idx,
              },
            },
            update: {
              question: faq.question,
              answer: faq.answer,
            },
            create: {
              tool1Id: pair.tool1Id,
              tool2Id: pair.tool2Id,
              question: faq.question,
              answer: faq.answer,
              order: idx,
            },
          }),
        ),
      )
    }

    console.log(
      `[CRON] Successfully generated content and scheduled ${pair.tool1.name} vs ${pair.tool2.name}`,
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated and scheduled comparison for ${pair.tool1.name} vs ${pair.tool2.name}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[CRON] Generation error:", error)
    return new Response(getErrorMessage(error), { status: 500 })
  }
}
