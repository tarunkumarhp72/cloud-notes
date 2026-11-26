import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../index.js";
import { authHandlers } from "./auth.js";
import { signAccessToken } from "../auth/jwt.js";
import { signRefreshToken, clearTokenRegistry } from "../auth/tokens.js";

describe("Auth Endpoints (/auth)", () => {
  beforeEach(() => {
    clearTokenRegistry();
    vi.restoreAllMocks();
  });

  it("POST /auth/google validates input and rejects missing code", async () => {
    const res = await app.request("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation error");
  });

  it("POST /auth/google exchanges code, issues tokens, and sets cookie", async () => {
    vi.spyOn(authHandlers, "exchangeGoogleCode").mockResolvedValue({
      sub: "google-user-12345",
      email: "tarunkumar@example.com",
      name: "Tarun Kumar",
      picture: "https://example.com/avatar.png",
    });

    const res = await app.request("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "valid-auth-code",
        codeVerifier: "valid-verifier-string-1234567890",
        redirectUri: "http://localhost:3000/auth/callback",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe("tarunkumar@example.com");
    expect(body.user.displayName).toBe("Tarun Kumar");

    // Verify Set-Cookie header is present
    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("POST /auth/refresh returns new access token and rotated refresh cookie", async () => {
    const { token: initialRefresh } = await signRefreshToken("user-abc");

    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: {
        Cookie: `refresh_token=${initialRefresh}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.userId).toBe("user-abc");

    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toContain("refresh_token=");
  });

  it("POST /auth/logout clears refresh cookie", async () => {
    const res = await app.request("/auth/logout", {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toContain("Max-Age=0");
  });

  it("GET /auth/me returns user profile with valid token and 401 with invalid token", async () => {
    const validToken = await signAccessToken("user-xyz", "tarun@example.com");

    const validRes = await app.request("/auth/me", {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    expect(validRes.status).toBe(200);
    const validBody = await validRes.json();
    expect(validBody.user.id).toBe("user-xyz");
    expect(validBody.user.email).toBe("tarun@example.com");

    const invalidRes = await app.request("/auth/me", {
      headers: {
        Authorization: "Bearer invalid.token.payload",
      },
    });

    expect(invalidRes.status).toBe(401);
  });
});
