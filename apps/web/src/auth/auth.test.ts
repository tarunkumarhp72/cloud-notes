import { describe, it, expect, beforeEach } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
  storePkceSession,
  retrievePkceSession,
} from "./pkce";
import { buildGoogleAuthUrl, validateGoogleCallback } from "./googleAuth";

// Mock sessionStorage in node environment
const mockStorage: Record<string, string> = {};
globalThis.sessionStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
};

describe("PKCE Flow Utilities", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("generates a high-entropy random string and verifier", () => {
    const str1 = generateRandomString(32);
    const str2 = generateRandomString(32);
    expect(str1).not.toBe(str2);
    expect(str1.length).toBe(32);

    const verifier = generateCodeVerifier();
    expect(verifier.length).toBe(64);
    // Verifier must only contain URL-safe chars
    expect(/^[A-Za-z0-9\-._~]+$/.test(verifier)).toBe(true);
  });

  it("derives S256 code challenge correctly", async () => {
    // Known test vector for RFC 7636
    const knownVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(knownVerifier);

    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("stores and retrieves PKCE state", () => {
    storePkceSession("state123", "verifierABC");
    const retrieved = retrievePkceSession("state123");
    expect(retrieved).toBe("verifierABC");

    // Retrieved session should be consumed and removed
    expect(retrievePkceSession("state123")).toBeNull();
  });
});

describe("Google OAuth URL and Callback Validation", () => {
  const dummyClientId = "test-client-id.apps.googleusercontent.com";
  const dummyRedirectUri = "http://localhost:3000/auth/callback";

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("builds correct Google OAuth 2.0 authorization URL", async () => {
    const auth = await buildGoogleAuthUrl({
      clientId: dummyClientId,
      redirectUri: dummyRedirectUri,
      state: "custom-state-999",
    });

    const parsed = new URL(auth.url);
    expect(parsed.origin).toBe("https://accounts.google.com");
    expect(parsed.pathname).toBe("/o/oauth2/v2/auth");
    expect(parsed.searchParams.get("client_id")).toBe(dummyClientId);
    expect(parsed.searchParams.get("redirect_uri")).toBe(dummyRedirectUri);
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("code_challenge")).toBe(auth.challenge);
    expect(parsed.searchParams.get("state")).toBe("custom-state-999");
  });

  it("validates successful Google callback and retrieves verifier", async () => {
    const auth = await buildGoogleAuthUrl({
      clientId: dummyClientId,
      redirectUri: dummyRedirectUri,
    });

    const params = new URLSearchParams({
      code: "google-auth-code-12345",
      state: auth.state,
    });

    const result = validateGoogleCallback(params, auth.state);
    expect(result.code).toBe("google-auth-code-12345");
    expect(result.verifier).toBe(auth.verifier);
  });

  it("rejects callback if state does not match", async () => {
    await buildGoogleAuthUrl({
      clientId: dummyClientId,
      redirectUri: dummyRedirectUri,
      state: "state-original",
    });

    const params = new URLSearchParams({
      code: "some-code",
      state: "state-tampered",
    });

    expect(() => validateGoogleCallback(params, "state-original")).toThrow(
      "Invalid state parameter: possible CSRF attempt"
    );
  });

  it("throws on Google OAuth error response", () => {
    const params = new URLSearchParams({
      error: "access_denied",
      error_description: "The user denied access",
      state: "my-state",
    });

    expect(() => validateGoogleCallback(params, "my-state")).toThrow(
      "Google OAuth error: The user denied access"
    );
  });
});
