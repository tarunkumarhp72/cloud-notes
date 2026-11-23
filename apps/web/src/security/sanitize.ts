import DOMPurify from "dompurify";

export const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];

/**
 * Validates whether a given URL adheres to strictly allowed protocols.
 */
export function isValidProtocol(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Allow relative links and fragments
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return true;
  }

  // Reject dangerous pseudo-protocols before standard parsing
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL, returning an empty string if malicious or invalid.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (isValidProtocol(trimmed)) {
    return trimmed;
  }
  return "";
}

// Hook DOMPurify to enforce rel="noopener noreferrer" and target="_blank" on all anchors
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer");
    node.setAttribute("target", "_blank");
    const href = node.getAttribute("href");
    if (href && !isValidProtocol(href)) {
      node.removeAttribute("href");
    }
  }
});

/**
 * Strips script tags, unsafe event handlers, and unauthorized elements from HTML.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "hr",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "s",
      "del",
      "u",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title", "class"],
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "svg",
      "math",
    ],
    FORBID_ATTR: [
      "onload",
      "onerror",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onkeydown",
      "onkeyup",
    ],
  });
}

/**
 * Strips scripts, embedded objects, and malicious protocols from markdown.
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return "";

  let cleaned = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");

  // Convert markdown links with dangerous protocols to '#'
  cleaned = cleaned.replace(/\[([^\]]+)\]\((javascript|vbscript|data|file):[^)]*\)/gi, "[$1](#)");

  return cleaned;
}
