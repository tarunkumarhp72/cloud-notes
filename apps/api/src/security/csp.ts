import type { MiddlewareHandler } from "hono";

export const DEFAULT_CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' http://localhost:* https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Enforces strict Content Security Policy and HTTP security headers across API responses.
 */
export const cspMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();
    c.header("Content-Security-Policy", DEFAULT_CSP_DIRECTIVES);
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  };
};
