import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { LRUCache } from "lru-cache";

// Explicitly load .env file from apps/api/.env or root repository .env
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    process.loadEnvFile(path.resolve(__dirname, "../../../.env"));
  } catch {
    // Environment already supplied by host/container/CI runner
  }
}

// Strict Cyber Security Zod Validation Schema: Zero Fallbacks (no "||" operators permitted)
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform((val) => Number(val)),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is strictly required"),
  DB_MAX_CONNECTIONS: z.string().transform((val) => Number(val)),
  DB_IDLE_TIMEOUT_SEC: z.string().transform((val) => Number(val)),
  DB_CONNECT_TIMEOUT_SEC: z.string().transform((val) => Number(val)),
  DB_SSL: z
    .enum(["require", "false"])
    .transform((val) => (val === "false" ? false : ("require" as const))),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is strictly required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is strictly required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for HMAC-SHA256 zero-trust security"),
  JWT_ALGORITHM: z.enum(["HS256", "HS384", "HS512"]),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1, "JWT_ACCESS_EXPIRES_IN is strictly required"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1, "JWT_REFRESH_EXPIRES_IN is strictly required"),

  REFRESH_COOKIE_MAX_AGE_SEC: z.string().transform((val) => Number(val)),
  REFRESH_COOKIE_PATH: z.string().min(1, "REFRESH_COOKIE_PATH is strictly required"),
  COOKIE_SAMESITE: z.enum(["Strict", "Lax", "None"]),

  RATE_LIMIT_AUTH_WINDOW_MS: z.string().transform((val) => Number(val)),
  RATE_LIMIT_AUTH_MAX: z.string().transform((val) => Number(val)),
  RATE_LIMIT_SYNC_WINDOW_MS: z.string().transform((val) => Number(val)),
  RATE_LIMIT_SYNC_MAX: z.string().transform((val) => Number(val)),

  MAX_NOTES_PER_USER: z.string().transform((val) => Number(val)),
  MAX_NOTE_PAYLOAD_BYTES: z.string().transform((val) => Number(val)),

  CACHE_TOKEN_MAX_ITEMS: z.string().transform((val) => Number(val)),
  CACHE_TOKEN_TTL_MS: z.string().transform((val) => Number(val)),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `  - [${issue.path.join(".")}]: ${issue.message}`)
    .join("\n");
  throw new Error(`[CRITICAL SECURITY CONFIGURATION ERROR] Missing or invalid environment variables:\n${issues}`);
}

const env = parsedEnv.data;

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,

  database: {
    url: env.DATABASE_URL,
    maxConnections: env.DB_MAX_CONNECTIONS,
    idleTimeoutSec: env.DB_IDLE_TIMEOUT_SEC,
    connectTimeoutSec: env.DB_CONNECT_TIMEOUT_SEC,
    ssl: env.DB_SSL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    algorithm: env.JWT_ALGORITHM,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  cookies: {
    refreshMaxAgeSec: env.REFRESH_COOKIE_MAX_AGE_SEC,
    refreshPath: env.REFRESH_COOKIE_PATH,
    sameSite: env.COOKIE_SAMESITE,
    secure: env.NODE_ENV === "production",
  },

  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },

  rateLimit: {
    auth: {
      windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
      max: env.RATE_LIMIT_AUTH_MAX,
    },
    sync: {
      windowMs: env.RATE_LIMIT_SYNC_WINDOW_MS,
      max: env.RATE_LIMIT_SYNC_MAX,
    },
  },

  limits: {
    maxNotesPerUser: env.MAX_NOTES_PER_USER,
    maxNotePayloadBytes: env.MAX_NOTE_PAYLOAD_BYTES,
  },

  cache: {
    tokenCacheMax: env.CACHE_TOKEN_MAX_ITEMS,
    tokenCacheTtlMs: env.CACHE_TOKEN_TTL_MS,
  },
} as const;

// High-performance LRU Cache for decoded/verified JWT payloads to avoid redundant crypto operations
export const tokenVerificationCache = new LRUCache<string, any>({
  max: config.cache.tokenCacheMax,
  ttl: config.cache.tokenCacheTtlMs,
});
