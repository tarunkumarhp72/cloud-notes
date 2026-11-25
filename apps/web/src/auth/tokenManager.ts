import { webConfig } from "../config";

/**
 * Checks whether a JWT token is expired (or close to expiring within 30 seconds).
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const nodeBuffer = (globalThis as Record<string, any>).Buffer;
    const payloadJson = typeof atob === "function"
      ? atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      : nodeBuffer.from(parts[1], "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    if (!payload.exp) return false;
    // Buffer of 30 seconds before expiration
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * Attempts to silently refresh the access token via the HTTP-only 15-day refresh cookie.
 */
export async function refreshAccessToken(apiBaseUrl = webConfig.apiBaseUrl): Promise<string | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken && typeof window !== "undefined") {
      localStorage.setItem("notepad_token", data.accessToken);
      return data.accessToken;
    }
  } catch {
    // Network errors or offline mode
  }
  return null;
}

/**
 * Returns a valid, non-expired access token. Automatically rotates/refreshes if needed.
 */
export async function getValidAccessToken(apiBaseUrl = webConfig.apiBaseUrl): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const current = localStorage.getItem("notepad_token");
  if (current && !isTokenExpired(current)) {
    return current;
  }
  return await refreshAccessToken(apiBaseUrl);
}

/**
 * Enhanced fetch wrapper with automatic JWT Authorization header and 401 retry on token refresh.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  apiBaseUrl = webConfig.apiBaseUrl
): Promise<Response> {
  let token = await getValidAccessToken(apiBaseUrl);
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: init.credentials || "include",
  });

  if (response.status === 401) {
    // Attempt silent refresh and retry once
    token = await refreshAccessToken(apiBaseUrl);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, {
        ...init,
        headers,
        credentials: init.credentials || "include",
      });
    }
  }

  return response;
}
