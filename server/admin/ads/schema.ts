import type { Ad } from "@prisma/client"
import { AdType } from "@prisma/client"
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { z } from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export const adsTableParamsSchema = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<Ad>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const adsTableParamsCache = createSearchParamsCache(adsTableParamsSchema)
export type AdsTableSchema = Awaited<ReturnType<typeof adsTableParamsCache.parse>>

export const adFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required").max(500, "Description cannot exceed 500 characters"),
  websiteUrl: z.string().url("Must be a valid URL"),
  faviconUrl: z.string().nullish(),
  buttonLabel: z.string().nullish(),
  type: z.nativeEnum(AdType),
  displayPages: z.array(z.string()).default([]),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  email: z.string().email("Must be a valid email").or(z.literal("")),
})

export type AdFormSchema = z.infer<typeof adFormSchema>
