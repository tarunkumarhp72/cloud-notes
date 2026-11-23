import { describe, it, expect } from "vitest";
import { generateAesKey, exportAesKey } from "@notepad/core";
import {
  generateRawRecoveryKey,
  formatRecoveryKey,
  normalizeRecoveryKey,
  wrapVaultKeyWithRecovery,
  unwrapVaultKeyWithRecovery,
} from "./vaultRecovery";

describe("vaultRecovery", () => {
  it("generates 32-byte recovery key and formats to 64-character hyphenated hex", () => {
    const raw = generateRawRecoveryKey();
    expect(raw.byteLength).toBe(32);

    const formatted = formatRecoveryKey(raw);
    // 64 hex chars split into 16 groups of 4 separated by 15 hyphens = 79 chars
    expect(formatted.length).toBe(79);
    expect(formatted.split("-")).toHaveLength(16);

    const normalized = normalizeRecoveryKey(formatted);
    expect(normalized).toEqual(raw);
  });

  it("handles messy user inputs (lowercase, spaces, hyphens) during normalization", () => {
    const raw = generateRawRecoveryKey();
    const formatted = formatRecoveryKey(raw);
    const messy = "  " + formatted.toLowerCase().replace(/-/g, " - ") + "   ";

    const normalized = normalizeRecoveryKey(messy);
    expect(normalized).toEqual(raw);
  });

  it("rejects invalid recovery key lengths", () => {
    expect(() => normalizeRecoveryKey("short-key")).toThrow(
      "Invalid recovery key: must be 64 hexadecimal characters"
    );
  });

  it("wraps and unwraps the vault master key correctly", async () => {
    const masterKey = await generateAesKey();
    const rawMasterBytes = await exportAesKey(masterKey);

    const recoveryBytes = generateRawRecoveryKey();
    const formattedRecoveryKey = formatRecoveryKey(recoveryBytes);

    const wrappedVerifier = await wrapVaultKeyWithRecovery(masterKey, recoveryBytes);
    expect(typeof wrappedVerifier).toBe("string");

    const unwrappedKey = await unwrapVaultKeyWithRecovery(formattedRecoveryKey, wrappedVerifier);
    const rawUnwrappedBytes = await exportAesKey(unwrappedKey);

    expect(rawUnwrappedBytes).toEqual(rawMasterBytes);
  });

  it("fails to unwrap when given a wrong recovery key", async () => {
    const masterKey = await generateAesKey();
    const recoveryBytes = generateRawRecoveryKey();
    const wrappedVerifier = await wrapVaultKeyWithRecovery(masterKey, recoveryBytes);

    const wrongRecoveryBytes = generateRawRecoveryKey();
    const wrongFormattedKey = formatRecoveryKey(wrongRecoveryBytes);

    await expect(
      unwrapVaultKeyWithRecovery(wrongFormattedKey, wrappedVerifier)
    ).rejects.toThrow();
  });
});
