import { describe, it, expect } from "vitest";
import { app } from "./index.js";

describe("API health check", () => {
  it("GET /health returns 200 with service information", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("notepad-api");
    expect(body).toHaveProperty("database");
    expect(body).toHaveProperty("timestamp");
  });
});
