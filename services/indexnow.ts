import { env } from "~/env"

/**
 * Submits an array of URLs to the Bing IndexNow API.
 * This function fails silently to ensure it never blocks or crashes the main application flow.
 *
 * @param urls List of absolute URLs to submit (e.g., ["https://coldemailkit.com/tools/example"])
 */
export async function submitToIndexNow(urls: string[]) {
  if (env.ENABLE_INDEXNOW !== "true") {
    return
  }

  if (!urls.length) {
    return
  }

  try {
    const host = new URL(env.NEXT_PUBLIC_SITE_URL).hostname
    const key = "b2e1bddef8fc40edb94ef3d68bec06aa"

    const payload = {
      host: host,
      key: key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: urls,
    }

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(
        `[IndexNow] Failed to submit URLs. Status: ${response.status} ${response.statusText}`,
      )
    } else {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URL(s)`)
    }
  } catch (error) {
    console.error("[IndexNow] Error submitting URLs:", error)
  }
}
