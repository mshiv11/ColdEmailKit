"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { VALID_SCOPES, generateApiKey, validateScopes } from "~/lib/api-keys"
import { adminProcedure } from "~/lib/safe-actions"
import { db } from "~/services/db"

/**
 * Create a new API key via server action (used by the admin UI).
 * Returns the raw key — it must be copied immediately as it cannot be retrieved later.
 */
export const createApiKey = adminProcedure
  .createServerAction()
  .input(
    z.object({
      name: z.string().min(1, "Name is required").max(100),
      scopes: z.array(z.string()).min(1, "At least one scope is required"),
      expiresInDays: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ input, ctx }) => {
    const { name, scopes, expiresInDays } = input

    // Validate scopes
    if (!validateScopes(scopes)) {
      throw new Error(`Invalid scopes. Valid scopes: ${VALID_SCOPES.join(", ")}`)
    }

    // Generate key
    const { rawKey, keyHash, keyPrefix } = generateApiKey()

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Store in database
    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        scopes,
        expiresAt,
        userId: ctx.user.id,
      },
    })

    revalidatePath("/admin/api-keys")

    return {
      id: apiKey.id,
      rawKey,
      keyPrefix,
    }
  })

/**
 * Revoke an API key (soft-delete) via server action.
 */
export const revokeApiKey = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id }, ctx }) => {
    // Verify ownership
    const apiKey = await db.apiKey.findFirst({
      where: { id, userId: ctx.user.id },
    })

    if (!apiKey) {
      throw new Error("API key not found")
    }

    if (apiKey.isRevoked) {
      throw new Error("API key is already revoked")
    }

    await db.apiKey.update({
      where: { id },
      data: { isRevoked: true },
    })

    revalidatePath("/admin/api-keys")
  })

/**
 * Permanently delete an API key and all its usage logs via server action.
 */
export const deleteApiKey = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id }, ctx }) => {
    // Verify ownership
    const apiKey = await db.apiKey.findFirst({
      where: { id, userId: ctx.user.id },
    })

    if (!apiKey) {
      throw new Error("API key not found")
    }

    // Hard-delete — cascade will remove logs automatically
    await db.apiKey.delete({
      where: { id },
    })

    revalidatePath("/admin/api-keys")
  })
