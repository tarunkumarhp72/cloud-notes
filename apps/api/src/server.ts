import { serve } from "@hono/node-server";
import { app } from "./index";
import { config } from "./config";

const port = config.port;
console.log(`[API] Notepad API server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
