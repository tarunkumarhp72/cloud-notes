import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LRUCache } from "lru-cache";

// Ensure .env is loaded if running directly without preloader
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    process.loadEnvFile(path.resolve(__dirname, "../../../.env"));
  } catch {
    // Already loaded or in CI environment
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("Security Alert: JWT_SECRET environment variable is strictly required in production!");
}

export const config = {
  env: nodeEnv,
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 3001,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  database: {
    url: process.env.DATABASE_URL || "",
    maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 10,
    idleTimeoutSec: Number(process.env.DB_IDLE_TIMEOUT_SEC) || 20,
    connectTimeoutSec: Number(process.env.DB_CONNECT_TIMEOUT_SEC) || 10,
    ssl: (process.env.DB_SSL === "false" ? false : "require") as "require" | false,
  },

  jwt: {
    secret: process.env.JWT_SECRET || (isTest ? "notepad-cloud-test-jwt-secret-32-bytes-min!!" : ""),
    algorithm: (process.env.JWT_ALGORITHM || "HS256") as "HS256" | "HS384" | "HS512",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "15d",
  },

  cookies: {
    refreshMaxAgeSec: Number(process.env.REFRESH_COOKIE_MAX_AGE_SEC) || 15 * 24 * 60 * 60,
    refreshPath: process.env.REFRESH_COOKIE_PATH || "/auth",
    sameSite: (process.env.COOKIE_SAMESITE || "Strict") as "Strict" | "Lax" | "None",
    secure: isProduction,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  rateLimit: {
    auth: {
      windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 100,
    },
    sync: {
      windowMs: Number(process.env.RATE_LIMIT_SYNC_WINDOW_MS) || 60 * 1000,
      max: Number(process.env.RATE_LIMIT_SYNC_MAX) || 180,
    },
  },

  limits: {
    maxNotesPerUser: Number(process.env.MAX_NOTES_PER_USER) || 50,
    maxNotePayloadBytes: Number(process.env.MAX_NOTE_PAYLOAD_BYTES) || 5_000_000,
  },

  cache: {
    tokenCacheMax: Number(process.env.CACHE_TOKEN_MAX_ITEMS) || 1000,
    tokenCacheTtlMs: Number(process.env.CACHE_TOKEN_TTL_MS) || 5 * 60 * 1000, // 5 minutes
  },
} as const;

// High-performance LRU Cache for decoded/verified JWT payloads to avoid redundant crypto operations
export const tokenVerificationCache = new LRUCache<string, any>({
  max: config.cache.tokenCacheMax,
  ttl: config.cache.tokenCacheTtlMs,
});
