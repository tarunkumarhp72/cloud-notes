// PKCE (Proof Key for Code Exchange) utilities adhering to RFC 7636

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateRandomString(length = 64): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

const PKCE_STATE_PREFIX = "pkce_state_";

export function storePkceSession(state: string, verifier: string): void {
  try {
    sessionStorage.setItem(`${PKCE_STATE_PREFIX}${state}`, verifier);
  } catch {
    // Fallback for non-browser or storage restricted environments
  }
}

export function retrievePkceSession(state: string): string | null {
  try {
    const key = `${PKCE_STATE_PREFIX}${state}`;
    const verifier = sessionStorage.getItem(key);
    if (verifier) {
      sessionStorage.removeItem(key);
    }
    return verifier;
  } catch {
    return null;
  }
}

export function clearPkceSession(state?: string): void {
  try {
    if (state) {
      sessionStorage.removeItem(`${PKCE_STATE_PREFIX}${state}`);
    } else {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(PKCE_STATE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Ignore storage errors on cleanup
  }
}
