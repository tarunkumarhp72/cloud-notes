import type { MiddlewareHandler } from "hono";
import type { ZodTypeAny } from "zod";

declare module "hono" {
  interface ContextVariableMap {
    validBody: unknown;
  }
}

/**
 * Validates JSON request bodies against a Zod schema.
 * Rejects invalid bodies with HTTP 400 Bad Request and structured errors.
 */
export const validateBody = (schema: ZodTypeAny): MiddlewareHandler => {
  return async (c, next) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json(
        {
          error: "Invalid JSON",
          message: "The request body must be valid JSON.",
        },
        400
      );
    }

    const result = await schema.safeParseAsync(rawBody);
    if (!result.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Request payload failed schema validation.",
          details: result.error.issues,
        },
        400
      );
    }

    // Attach parsed body for downstream handlers
    c.set("validBody", result.data);
    await next();
  };
};
