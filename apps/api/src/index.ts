import { Hono } from "hono";
import { handle } from "hono/vercel";
import { checkDbConnection } from "./db";
import { authRouter } from "./routes/auth";
import { syncRouter } from "./routes/sync";
import { accountRouter } from "./routes/account";
import { backupRouter } from "./routes/backup";
import { startBackupScheduler } from "./backup/scheduler";
import { cspMiddleware } from "./security/csp";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { config } from "./config";

export const app = new Hono();

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

if (!config.isTest) {
  startBackupScheduler();
}

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
