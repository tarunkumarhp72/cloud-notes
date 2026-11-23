import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(path.resolve(__dirname, "../../../.env"));
} catch {
  // Fallback if .env is already loaded or in test/CI
}

import { serve } from "@hono/node-server";
import { app } from "./index";

const port = Number(process.env.PORT) || 3001;
console.log(`[API] Notepad API server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
