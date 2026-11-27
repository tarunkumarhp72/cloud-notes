/**
 * Application Frontend Configuration
 * Strictly driven by environment variables (Vite import.meta.env).
 * Centralized config: no component should read import.meta.env directly.
 */

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export interface WebConfig {
  googleClientId: string;
  googleRedirectUri: string;
  apiBaseUrl: string;
  guestNoteLimit: number;
  userNoteLimit: number;
  guestMaxNoteChars: number;
  maxNoteChars: number;
  autoSaveDebounceMs: number;
  autoSaveMaxWaitMs: number;
}

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_PROD_URL) {
    return import.meta.env.VITE_API_PROD_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://cloud-notes-api-seven.vercel.app";
  }
  return "";
}

export const webConfig: WebConfig = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  googleRedirectUri:
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : ""),
  apiBaseUrl: getApiBaseUrl(),
  guestNoteLimit: parseNumber(import.meta.env.VITE_GUEST_NOTE_LIMIT, 10),
  userNoteLimit: parseNumber(import.meta.env.VITE_USER_NOTE_LIMIT, 50),
  guestMaxNoteChars: parseNumber(import.meta.env.VITE_GUEST_MAX_NOTE_CHARS, 25_000),
  maxNoteChars: parseNumber(import.meta.env.VITE_MAX_NOTE_CHARS, 100_000),
  autoSaveDebounceMs: parseNumber(import.meta.env.VITE_AUTOSAVE_DEBOUNCE_MS, 1000),
  autoSaveMaxWaitMs: parseNumber(import.meta.env.VITE_AUTOSAVE_MAX_WAIT_MS, 10000),
};
