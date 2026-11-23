import { Hono } from "hono";
import { handle } from "hono/vercel";
import { checkDbConnection } from "./db";
import { authRouter } from "./routes/auth";
import { syncRouter } from "./routes/sync";
import { cspMiddleware } from "./security/csp";

export const app = new Hono();

app.use("*", cspMiddleware());

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
