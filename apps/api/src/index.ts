import { Hono } from "hono";
import { handle } from "hono/vercel";
import { checkDbConnection } from "./db";
import { authRouter } from "./routes/auth";
import { syncRouter } from "./routes/sync";
import { cspMiddleware } from "./security/csp";
import { rateLimitMiddleware } from "./middleware/rateLimit";

export const app = new Hono();

app.use("*", cspMiddleware());

app.use(
  "/auth/*",
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many authentication attempts. Please try again later.",
  })
);

app.use(
  "/sync/*",
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 180,
    message: "Sync rate limit exceeded. Please try again later.",
  })
);

app.use(
  "/api/sync/*",
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 180,
    message: "Sync rate limit exceeded. Please try again later.",
  })
);

app.route("/auth", authRouter);
app.route("/sync", syncRouter);
app.route("/api/sync", syncRouter);

app.get("/health", async (c) => {
  const dbStatus = await checkDbConnection();
  return c.json({
    status: "ok",
    service: "notepad-api",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default handle(app);
