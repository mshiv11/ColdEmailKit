import wretch from "wretch"
import { env } from "~/env"

/**
 * Get a wretch instance configured for the PostHog Query API (HogQL).
 * Uses a Personal API Key for authentication (server-side only).
 */
export const getPostHogQueryApi = () => {
  const host = env.NEXT_PUBLIC_POSTHOG_HOST
  const projectId = env.POSTHOG_PROJECT_ID
  const personalApiKey = env.POSTHOG_PERSONAL_API_KEY

  return wretch(`${host}/api/projects/${projectId}/query/`).auth(`Bearer ${personalApiKey}`)
}
