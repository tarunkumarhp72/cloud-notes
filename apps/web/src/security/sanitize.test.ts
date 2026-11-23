import { describe, it, expect } from "vitest";
import { isValidProtocol, sanitizeUrl, sanitizeHtml, sanitizeMarkdown } from "./sanitize";

describe("T-043 Security Sanitization Module", () => {
  describe("isValidProtocol & sanitizeUrl", () => {
    it("allows safe http, https, and mailto protocols", () => {
      expect(isValidProtocol("https://example.com")).toBe(true);
      expect(isValidProtocol("http://example.com/path")).toBe(true);
      expect(isValidProtocol("mailto:user@domain.com")).toBe(true);
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    });

    it("allows relative links and hash fragments", () => {
      expect(isValidProtocol("/notes")).toBe(true);
      expect(isValidProtocol("#section")).toBe(true);
      expect(sanitizeUrl("/notes")).toBe("/notes");
    });

    it("rejects javascript: and other dangerous pseudo-protocols", () => {
      expect(isValidProtocol("javascript:alert(1)")).toBe(false);
      expect(isValidProtocol("javascript:alert(document.cookie)")).toBe(false);
      expect(isValidProtocol("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidProtocol("vbscript:MsgBox(1)")).toBe(false);
      expect(isValidProtocol("file:///etc/passwd")).toBe(false);
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("data:text/html,...")).toBe("");
    });
  });

  describe("sanitizeHtml", () => {
    it("strips script tags and inline handlers", () => {
      const malicious = '<p>Hello</p><script>alert("XSS")</script><img src="x" onerror="alert(1)" />';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).not.toContain("onerror");
      expect(sanitized).toContain("<p>Hello</p>");
    });

    it("strips dangerous iframes and objects", () => {
      const malicious = '<iframe src="https://evil.com"></iframe><object data="test"></object>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).toBe("");
    });

    it("adds rel='noopener noreferrer' and target='_blank' to anchors", () => {
      const anchor = '<a href="https://example.com">Visit site</a>';
      const sanitized = sanitizeHtml(anchor);
      expect(sanitized).toContain('rel="noopener noreferrer"');
      expect(sanitized).toContain('target="_blank"');
    });

    it("strips javascript: hrefs inside anchors", () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("alert");
    });
  });

  describe("sanitizeMarkdown", () => {
    it("neutralizes javascript: in markdown links", () => {
      const markdown = "[Click Me](javascript:alert(1)) and [Normal Link](https://google.com)";
      const cleaned = sanitizeMarkdown(markdown);
      expect(cleaned).toContain("[Click Me](#)");
      expect(cleaned).toContain("[Normal Link](https://google.com)");
      expect(cleaned).not.toContain("javascript:");
    });

    it("strips inline script tags from markdown", () => {
      const markdown = "# Title\n<script>alert(1)</script>\nContent";
      const cleaned = sanitizeMarkdown(markdown);
      expect(cleaned).not.toContain("<script>");
      expect(cleaned).toContain("# Title");
      expect(cleaned).toContain("Content");
    });
  });
});
