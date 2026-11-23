import type { MiddlewareHandler } from "hono";

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (c: Parameters<MiddlewareHandler>[0]) => string;
  message?: string;
}

interface WindowRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records = new Map<string, WindowRecord>();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(options: { windowMs: number; max: number }) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  public check(key: string, now: number = Date.now()): {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
    limit: number;
  } {
    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    const windowStart = now - this.windowMs;
    // Filter timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const count = record.timestamps.length;
    const oldest = record.timestamps[0] ?? now;
    const resetSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));

    if (count >= this.max) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
        limit: this.max,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, this.max - (count + 1)),
      resetSeconds,
      limit: this.max,
    };
  }

  public reset(): void {
    this.records.clear();
  }
}

/**
 * Creates sliding-window rate limiting middleware for Hono routes.
 */
export const rateLimitMiddleware = (options: RateLimitOptions = {}): MiddlewareHandler => {
  const windowMs = options.windowMs ?? 60 * 1000; // 1 minute default
  const max = options.max ?? 60; // 60 requests default
  const message = options.message ?? "Too Many Requests: Rate limit exceeded.";
  const limiter = new SlidingWindowRateLimiter({ windowMs, max });

  const getClientIp = options.keyGenerator ?? ((c) => {
    return (
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "127.0.0.1"
    );
  });

  return async (c, next) => {
    const ip = getClientIp(c);
    const result = limiter.check(ip);

    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", result.resetSeconds.toString());

    if (!result.allowed) {
      c.header("Retry-After", result.resetSeconds.toString());
      return c.json(
        {
          error: "Too Many Requests",
          message,
          retryAfter: result.resetSeconds,
        },
        429
      );
    }

    await next();
  };
};
