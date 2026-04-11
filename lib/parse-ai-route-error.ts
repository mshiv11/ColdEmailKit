export const parseAiRouteError = (message: string, fallbackMessage: string) => {
  if (!message) {
    return fallbackMessage
  }

  try {
    const parsed = JSON.parse(message) as { error?: string }
    return parsed.error || message
  } catch {
    return message
  }
}
