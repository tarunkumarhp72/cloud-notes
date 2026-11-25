import { describe, it, expect } from "vitest";
import { calculateNextBackupDate } from "./backupService";

describe("Backup Schedule Calculations", () => {
  it("calculates daily schedule accurately (+1 day)", () => {
    const base = new Date("2026-11-24T12:00:00Z");
    const next = calculateNextBackupDate("daily", base);

    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-11-25T12:00:00.000Z");
  });

  it("calculates weekly schedule accurately (+7 days)", () => {
    const base = new Date("2026-11-24T12:00:00Z");
    const next = calculateNextBackupDate("weekly", base);

    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-12-01T12:00:00.000Z");
  });

  it("calculates monthly schedule accurately (+1 month)", () => {
    const base = new Date("2026-11-24T12:00:00Z");
    const next = calculateNextBackupDate("monthly", base);

    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-12-24T12:00:00.000Z");
  });

  it("returns null when frequency is disabled", () => {
    const next = calculateNextBackupDate("disabled");
    expect(next).toBeNull();
  });
});
