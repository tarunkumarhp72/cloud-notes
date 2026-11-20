import { describe, it, expect, beforeEach } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";
import {
  signRefreshToken,
  rotateRefreshToken,
  getRefreshCookieOptions,
  clearTokenRegistry,
} from "./tokens";

describe("JWT Access Token Engine", () => {
  it("signs and verifies a 15-minute access token", async () => {
    const userId = "01934c2b-88a2-73a1-b84a-923f03b2241b";
    const email = "user@example.com";

    const token = await signAccessToken(userId, email);
    expect(typeof token).toBe("string");

    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.exp).toBeDefined();

    // Verify expiration is approximately 15 minutes (900 seconds) from issuedAt
    const lifespanSeconds = (payload.exp as number) - (payload.iat as number);
    expect(lifespanSeconds).toBe(900);
  });

  it("rejects tampered access tokens", async () => {
    const token = await signAccessToken("user-1", "user@test.com");
    const tampered = token.slice(0, -5) + "abcde";

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });
});

describe("Rotating Refresh Token Engine", () => {
  beforeEach(() => {
    clearTokenRegistry();
  });

  it("generates a 15-day refresh token with correct cookie parameters", async () => {
    const { token } = await signRefreshToken("user-123");
    expect(typeof token).toBe("string");

    const cookie = getRefreshCookieOptions(token);
    expect(cookie.name).toBe("refresh_token");
    expect(cookie.value).toBe(token);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Strict");
    expect(cookie.maxAge).toBe(15 * 24 * 60 * 60); // 15 days
    expect(cookie.path).toBe("/auth");
  });

  it("rotates refresh token and issues a new access token", async () => {
    const initial = await signRefreshToken("user-123");
    const rotated = await rotateRefreshToken(initial.token);

    expect(rotated.userId).toBe("user-123");
    expect(rotated.newAccessToken).toBeDefined();
    expect(rotated.newRefreshToken).toBeDefined();
    expect(rotated.newRefreshToken).not.toBe(initial.token);

    // Verify the newly rotated token can be rotated again
    const secondRotation = await rotateRefreshToken(rotated.newRefreshToken);
    expect(secondRotation.userId).toBe("user-123");
  });

  it("replay detection: reusing an already consumed refresh token revokes family", async () => {
    const initial = await signRefreshToken("user-victim");

    // First rotation (valid)
    const firstRotation = await rotateRefreshToken(initial.token);
    expect(firstRotation.newRefreshToken).toBeDefined();

    // Attacker or replay of the old initial.token
    await expect(rotateRefreshToken(initial.token)).rejects.toThrow(
      /Token replay detected/
    );

    // Legitimate user trying to use the latest token should now also be rejected
    // because the entire family was compromised and revoked!
    await expect(rotateRefreshToken(firstRotation.newRefreshToken)).rejects.toThrow(
      /Token replay detected/
    );
  });
});
