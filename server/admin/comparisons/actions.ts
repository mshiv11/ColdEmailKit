"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { adminProcedure } from "~/lib/safe-actions"
import { db } from "~/services/db"

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  order: z.number().int().default(0),
})

export const upsertComparisonFaq = adminProcedure
  .createServerAction()
  .input(
    z.object({
      id: z.string().optional(),
      tool1Id: z.string(),
      tool2Id: z.string(),
      question: z.string().min(5),
      answer: z.string().min(10),
      order: z.number().int().default(0),
    }),
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input

    const faq = await db.comparisonFaq.upsert({
      where: { id: id ?? "" },
      create: data,
      update: data,
    })

    revalidateTag(`comparison-faqs-${data.tool1Id}-${data.tool2Id}`)
    revalidateTag(`comparison-faqs-${data.tool2Id}-${data.tool1Id}`)
    revalidatePath("/admin/compare")

    return faq
  })

export const deleteComparisonFaq = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const faq = await db.comparisonFaq.delete({ where: { id } })

    revalidateTag(`comparison-faqs-${faq.tool1Id}-${faq.tool2Id}`)
    revalidateTag(`comparison-faqs-${faq.tool2Id}-${faq.tool1Id}`)
    revalidatePath("/admin/compare")

    return faq
  })

// Removed updateToolComparisonDescription Action

export const deleteComparisonData = adminProcedure
  .createServerAction()
  .input(z.object({ tool1Id: z.string(), tool2Id: z.string() }))
  .handler(async ({ input: { tool1Id, tool2Id } }) => {
    const [id1, id2] = [tool1Id, tool2Id].sort()
    
    await db.comparison.deleteMany({
      where: {
        tool1Id: id1,
        tool2Id: id2,
      },
    })
    
    revalidateTag(`comparison-data-${tool1Id}-${tool2Id}`)
    revalidateTag(`comparison-data-${tool2Id}-${tool1Id}`)
    revalidatePath("/admin/compare")

    return { success: true }
  })

export const upsertComparisonData = adminProcedure
  .createServerAction()
  .input(
    z.object({
      tool1Id: z.string(),
      tool2Id: z.string(),
      verdict: z.string().nullable(),
      customTitle: z.string().nullable().optional(),
      customDescription: z.string().nullable().optional(),
      tool1Description: z.string().nullable().optional(),
      tool2Description: z.string().nullable().optional(),
    }),
  )
  .handler(
    async ({
      input: {
        tool1Id,
        tool2Id,
        verdict,
        customTitle,
        customDescription,
        tool1Description,
        tool2Description,
      },
    }) => {
      // We enforce alphabetical ordering of IDs for the unique constraint
      const [id1, id2] = [tool1Id, tool2Id].sort()
      
      // Determine which description maps to which tool based on the sort
      const finalTool1Desc = id1 === tool1Id ? tool1Description : tool2Description;
      const finalTool2Desc = id1 === tool1Id ? tool2Description : tool1Description;

      const comparison = await db.comparison.upsert({
        where: {
          tool1Id_tool2Id: {
            tool1Id: id1,
            tool2Id: id2,
          },
        },
        create: {
          tool1Id: id1,
          tool2Id: id2,
          verdict,
          customTitle,
          customDescription,
          tool1Description: finalTool1Desc,
          tool2Description: finalTool2Desc,
        },
        update: {
          verdict,
          customTitle,
          customDescription,
          tool1Description: finalTool1Desc,
          tool2Description: finalTool2Desc,
        },
        select: { id: true },
      })

    revalidateTag(`comparison-data-${tool1Id}-${tool2Id}`)
    revalidateTag(`comparison-data-${tool2Id}-${tool1Id}`)
    revalidatePath("/admin/compare")

    return comparison
  })

export const reorderComparisonFaqs = adminProcedure
  .createServerAction()
  .input(z.object({ orders: z.array(z.object({ id: z.string(), order: z.number().int() })) }))
  .handler(async ({ input: { orders } }) => {
    await db.$transaction(
      orders.map(({ id, order }) => db.comparisonFaq.update({ where: { id }, data: { order } })),
    )

    revalidatePath("/admin/compare")
    return { success: true }
  })

export const deleteAllComparisonFaqs = adminProcedure
  .createServerAction()
  .input(z.object({ tool1Id: z.string(), tool2Id: z.string() }))
  .handler(async ({ input: { tool1Id, tool2Id } }) => {
    await db.comparisonFaq.deleteMany({
      where: {
        OR: [
          { tool1Id, tool2Id },
          { tool1Id: tool2Id, tool2Id: tool1Id },
        ],
      },
    })

    revalidateTag(`comparison-faqs-${tool1Id}-${tool2Id}`)
    revalidateTag(`comparison-faqs-${tool2Id}-${tool1Id}`)
    revalidatePath("/admin/compare")

    return { success: true }
  })

export const revalidateComparison = adminProcedure
  .createServerAction()
  .input(z.object({ slug1: z.string(), slug2: z.string() }))
  .handler(async ({ input: { slug1, slug2 } }) => {
    revalidatePath(`/compare/${slug1}-vs-${slug2}`)
    revalidatePath(`/compare/${slug2}-vs-${slug1}`)
    revalidateTag(`comparison-${slug1}`)
    revalidateTag(`comparison-${slug2}`)
    revalidateTag(`tool-${slug1}`)
    revalidateTag(`tool-${slug2}`)
    revalidatePath("/admin/compare")

    return { success: true }
  })
