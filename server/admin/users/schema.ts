import type { User } from "@prisma/client"
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { z } from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export const usersTableParamsSchema = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  sort: getSortingStateParser<User>().withDefault([{ id: "createdAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const usersTableParamsCache = createSearchParamsCache(usersTableParamsSchema)
export type UsersTableSchema = Awaited<ReturnType<typeof usersTableParamsCache.parse>>

export const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  role: z.enum(["admin", "user"]).optional(),
  slug: z.string().optional().or(z.literal("")),
  headline: z.string().optional().or(z.literal("")),
  shortBio: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
})

export type UserSchema = z.infer<typeof userSchema>
