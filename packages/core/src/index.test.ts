import { describe, it, expect } from "vitest";
import { CORE_VERSION } from "./index";

describe("core monorepo configuration", () => {
  it("exports CORE_VERSION", () => {
    expect(CORE_VERSION).toBe("0.1.0");
  });
});
