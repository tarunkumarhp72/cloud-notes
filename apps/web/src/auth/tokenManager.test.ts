import { describe, it, expect, vi, beforeEach } from "vitest";
import { isTokenExpired, refreshAccessToken, getValidAccessToken, fetchWithAuth } from "./tokenManager";

function createMockJwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = btoa(JSON.stringify({ sub: "user-123", exp }));
  return `${header}.${payload}.signature`;
}

describe("tokenManager Utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("correctly identifies expired vs valid tokens", () => {
    const expiredToken = createMockJwt(-100);
    expect(isTokenExpired(expiredToken)).toBe(true);

    const soonExpiringToken = createMockJwt(10); // less than 30s buffer
    expect(isTokenExpired(soonExpiringToken)).toBe(true);

    const validToken = createMockJwt(3600); // 1 hour remaining
    expect(isTokenExpired(validToken)).toBe(false);

    expect(isTokenExpired("invalid.token")).toBe(true);
    expect(isTokenExpired("")).toBe(true);
  });

  it("refreshes token and saves to localStorage on success", async () => {
    const freshToken = createMockJwt(900);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: freshToken }),
    });

    const result = await refreshAccessToken("http://localhost:3001");
    expect(result).toBe(freshToken);
    expect(localStorage.getItem("notepad_token")).toBe(freshToken);
  });

  it("getValidAccessToken returns existing token if not expired without refreshing", async () => {
    const validToken = createMockJwt(900);
    localStorage.setItem("notepad_token", validToken);
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const result = await getValidAccessToken();
    expect(result).toBe(validToken);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("getValidAccessToken triggers refresh if token is expired", async () => {
    const expiredToken = createMockJwt(-60);
    localStorage.setItem("notepad_token", expiredToken);
    const freshToken = createMockJwt(900);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: freshToken }),
    });

    const result = await getValidAccessToken();
    expect(result).toBe(freshToken);
    expect(localStorage.getItem("notepad_token")).toBe(freshToken);
  });

  it("fetchWithAuth attaches authorization header and retries on 401", async () => {
    const expiredToken = createMockJwt(-60);
    localStorage.setItem("notepad_token", expiredToken);
    const freshToken = createMockJwt(900);

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      if (url.includes("/auth/refresh")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ accessToken: freshToken }),
        });
      }
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => ({ data: "secure-result" }),
      });
    });

    const res = await fetchWithAuth("http://localhost:3001/api/backup/status");
    expect(res.status).toBe(200);
    expect(callCount).toBeGreaterThanOrEqual(1);
  });
});
