import postgres from "postgres";
import { config } from "./config";

const connectionString = config.database.url;

// Connection pool configured via config.ts / .env parameters
export const sql = connectionString && !config.isTest
  ? postgres(connectionString, {
      max: config.database.maxConnections,
      idle_timeout: config.database.idleTimeoutSec,
      connect_timeout: config.database.connectTimeoutSec,
      ssl: config.database.ssl,
    })
  : null;

export async function checkDbConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  if (!sql) {
    return { connected: false, error: "DATABASE_URL not configured or running in test mode" };
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
