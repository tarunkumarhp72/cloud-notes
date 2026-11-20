import { Hono } from "hono";
import { handle } from "hono/vercel";
import { checkDbConnection } from "./db";
import { authRouter } from "./routes/auth";

export const app = new Hono();

app.route("/auth", authRouter);

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
