import postgres from "postgres";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.DATABASE_URL) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    process.loadEnvFile(path.resolve(__dirname, "../../../.env"));
  } catch {
    // Fallback if .env is not found or already loaded
  }
}

const connectionString = process.env.DATABASE_URL;

// Lazy connection to avoid crashing when DATABASE_URL is not set during local mock tests
export const sql = connectionString
  ? postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    })
  : null;

export async function checkDbConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  if (!sql) {
    return { connected: false, error: "DATABASE_URL not configured" };
  }

  const start = Date.now();
  try {
    const result = await sql`SELECT 1 as ok`;
    const latencyMs = Date.now() - start;
    if (result && result.length > 0) {
      return { connected: true, latencyMs };
    }
    return { connected: false, error: "No response from database" };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}
