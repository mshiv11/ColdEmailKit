import { isTruthy } from "@primoui/utils"
import type { Prisma } from "@prisma/client"
import { endOfDay, startOfDay } from "date-fns"
import { db } from "~/services/db"
import type { ReviewsTableSchema } from "./schema"

export const findReviews = async (search: ReviewsTableSchema) => {
    const { comment, page, perPage, sort, from, to, operator } = search

    // Offset to paginate the results
    const offset = (page - 1) * perPage

    // Column and order to sort by
    const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

    // Convert the date strings to date objects
    const fromDate = from ? startOfDay(new Date(from)) : undefined
    const toDate = to ? endOfDay(new Date(to)) : undefined

    const expressions: (Prisma.ReviewWhereInput | undefined)[] = [
        // Filter by comment
        comment ? { comment: { contains: comment, mode: "insensitive" } } : undefined,

        // Filter by createdAt
        fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
    ]

    const where: Prisma.ReviewWhereInput = {
        [operator.toUpperCase()]: expressions.filter(isTruthy),
    }

    // Transaction is used to ensure both queries are executed in a single transaction
    const [reviews, reviewsTotal] = await db.$transaction([
        db.review.findMany({
            where,
            orderBy,
            take: perPage,
            skip: offset,
            include: {
                user: { select: { id: true, name: true } },
                tool: { select: { slug: true, name: true } },
            },
        }),

        db.review.count({
            where,
        }),
    ])

    const pageCount = Math.ceil(reviewsTotal / perPage)
    return { reviews, reviewsTotal, pageCount }
}

export const findReviewById = async (id: string) => {
    return db.review.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true } },
            tool: { select: { slug: true, name: true } },
        },
    })
}
