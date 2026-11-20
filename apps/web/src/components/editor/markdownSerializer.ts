/**
 * Bi-directional Markdown serializer and parser utilities.
 * Supports GFM tables, headings (H1-H6), lists, bold, italic, strikethrough, and links.
 */

export function normalizeMarkdown(markdown: string): string {
  if (!markdown) return "";
  return markdown.replace(/\r\n/g, "\n");
}

export function extractPlainTextFromMarkdown(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links
    .replace(/#{1,6}\s+/g, "") // headers
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // code
    .replace(/^\s*[-*+]\s+/gm, "") // bullet lists
    .replace(/^\s*\d+\.\s+/gm, ""); // numbered lists
}
