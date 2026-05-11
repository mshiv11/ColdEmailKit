export function stripMarkdown(markdown: string): string {
  // Remove ATX headers
  let text = markdown.replace(/^#{1,6}\s+/gm, "")
  // Remove Setext headers
  text = text.replace(/^=+|-+$/gm, "")
  // Remove formatting: strong, em, strike, code
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
  text = text.replace(/~~([^~]+)~~/g, "$1")
  text = text.replace(/`([^`]+)`/g, "$1")
  // Remove links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
  // Remove blockquotes
  text = text.replace(/^\s*>\s+/gm, "")
  // Remove lists
  text = text.replace(/^\s*[-*+]\s+/gm, "")
  text = text.replace(/^\s*\d+\.\s+/gm, "")
  // Remove horizontal rules
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "")
  // Remove bare URLs (best-effort heuristic if not captured)
  text = text.replace(/https?:\/\/[^\s]+/g, "")
  return text.trim()
}
