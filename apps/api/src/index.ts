import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkDbConnection } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { syncRouter } from "./routes/sync.js";
import { accountRouter } from "./routes/account.js";
import { backupRouter } from "./routes/backup.js";
import { startBackupScheduler } from "./backup/scheduler.js";
import { cspMiddleware } from "./security/csp.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { config } from "./config.js";

export const app = new Hono();

const allowedOrigin = config.frontendUrl.replace(/\/+$/, "");

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigin;
      const normalized = origin.replace(/\/+$/, "");
      if (normalized === allowedOrigin) return origin;
      if (!config.isProduction && /^http:\/\/localhost:\d+$/.test(normalized)) {
        return origin;
      }
      return "";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", cspMiddleware());

app.use(
  "/auth/*",
  rateLimitMiddleware({
    windowMs: config.rateLimit.auth.windowMs,
    max: config.rateLimit.auth.max,
    message: "Too many authentication attempts. Please try again later.",
  })
);

app.use(
  "/sync/*",
  rateLimitMiddleware({
    windowMs: config.rateLimit.sync.windowMs,
    max: config.rateLimit.sync.max,
    message: "Sync rate limit exceeded. Please try again later.",
  })
);

app.use(
  "/api/sync/*",
  rateLimitMiddleware({
    windowMs: config.rateLimit.sync.windowMs,
    max: config.rateLimit.sync.max,
    message: "Sync rate limit exceeded. Please try again later.",
  })
);

app.route("/auth", authRouter);
app.route("/sync", syncRouter);
app.route("/api/sync", syncRouter);
app.route("/account", accountRouter);
app.route("/api/account", accountRouter);
app.route("/backup", backupRouter);
app.route("/api/backup", backupRouter);

if (!config.isTest && !process.env.VERCEL) {
  startBackupScheduler();
}

app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "notepad-api",
    health: "/health",
  });
});

app.get("/health", async (c) => {
  const dbStatus = await checkDbConnection();
  return c.json({
    status: "ok",
    service: "notepad-api",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default app;
