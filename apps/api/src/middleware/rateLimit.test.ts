import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { rateLimitMiddleware, SlidingWindowRateLimiter } from "./rateLimit.js";
import { validateBody } from "./validate.js";

describe("T-044 API Rate Limiting and Validation", () => {
  describe("SlidingWindowRateLimiter", () => {
    it("allows requests up to max and rejects subsequent requests within window", () => {
      const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, max: 3 });
      const now = 10000;

      const r1 = limiter.check("ip-1", now);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = limiter.check("ip-1", now + 100);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check("ip-1", now + 200);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      // 4th request exceeds max
      const r4 = limiter.check("ip-1", now + 300);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.resetSeconds).toBeGreaterThan(0);

      // Different IP is still allowed
      const rOther = limiter.check("ip-2", now + 350);
      expect(rOther.allowed).toBe(true);
    });

    it("resets capacity once time slides past window", () => {
      const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, max: 2 });
      const now = 20000;

      limiter.check("ip-1", now);
      limiter.check("ip-1", now + 100);
      expect(limiter.check("ip-1", now + 200).allowed).toBe(false);

      // Advance clock past 1000ms window
      const future = now + 1100;
      const rFuture = limiter.check("ip-1", future);
      expect(rFuture.allowed).toBe(true);
    });
  });

  describe("rateLimitMiddleware", () => {
    it("returns HTTP 429 and Retry-After header when limit is exceeded", async () => {
      const app = new Hono();
      app.use(
        "/limited",
        rateLimitMiddleware({
          windowMs: 5000,
          max: 2,
        })
      );
      app.get("/limited", (c) => c.text("ok"));

      // Request 1
      const res1 = await app.request("/limited");
      expect(res1.status).toBe(200);
      expect(res1.headers.get("X-RateLimit-Remaining")).toBe("1");

      // Request 2
      const res2 = await app.request("/limited");
      expect(res2.status).toBe(200);
      expect(res2.headers.get("X-RateLimit-Remaining")).toBe("0");

      // Request 3 (exceeded)
      const res3 = await app.request("/limited");
      expect(res3.status).toBe(429);
      expect(res3.headers.get("Retry-After")).toBeDefined();
      const body = await res3.json();
      expect(body.error).toBe("Too Many Requests");
    });
  });

  describe("validateBody", () => {
    const TestSchema = z.object({
      name: z.string().min(2),
      count: z.number().int().positive(),
    });

    it("passes valid JSON bodies to handler", async () => {
      const app = new Hono();
      app.post("/test", validateBody(TestSchema), (c) => {
        const body = c.get("validBody");
        return c.json({ success: true, body });
      });

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Notepad", count: 42 }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.body.name).toBe("Notepad");
    });

    it("returns 400 Bad Request with details for invalid schemas", async () => {
      const app = new Hono();
      app.post("/test", validateBody(TestSchema), (c) => c.text("ok"));

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A", count: -5 }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation Error");
      expect(json.details.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 400 Bad Request for malformed JSON", async () => {
      const app = new Hono();
      app.post("/test", validateBody(TestSchema), (c) => c.text("ok"));

      const res = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not json }",
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON");
    });
  });
});
