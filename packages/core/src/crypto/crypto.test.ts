import { describe, it, expect } from "vitest";
import {
  generateAesKey,
  importAesKey,
  exportAesKey,
  encryptAesGcm,
  decryptAesGcm,
  deriveKeyFromPassphrase,
  generateSalt,
} from "./index";

describe("Web Crypto AES-256-GCM Primitives", () => {
  it("generates, exports, and imports a 256-bit AES key", async () => {
    const key = await generateAesKey();
    const raw = await exportAesKey(key);
    expect(raw.byteLength).toBe(32);

    const imported = await importAesKey(raw);
    expect(imported).toBeDefined();
    expect(imported.algorithm.name).toBe("AES-GCM");
  });

  it("rejects invalid key length on import", async () => {
    const invalidKey = new Uint8Array(16); // 128-bit instead of 256-bit
    await expect(importAesKey(invalidKey)).rejects.toThrow("AES-256 key must be 32 bytes");
  });

  it("encrypts and decrypts plaintext accurately (round-trip)", async () => {
    const key = await generateAesKey();
    const secretText = "# Hello Windows 11 Notepad\nThis is end-to-end encrypted notes content.";

    const encrypted = await encryptAesGcm(key, secretText);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(secretText);

    const decrypted = await decryptAesGcm(key, encrypted);
    expect(decrypted).toBe(secretText);
  });

  it("tamper detection: altering ciphertext throws an error", async () => {
    const key = await generateAesKey();
    const secretText = "Confidential note data";
    const encrypted = await encryptAesGcm(key, secretText);

    // Tamper with ciphertext by altering a base64 character
    const tamperedChars = encrypted.ciphertext.split("");
    tamperedChars[0] = tamperedChars[0] === "A" ? "B" : "A";
    const tamperedData = {
      ciphertext: tamperedChars.join(""),
      iv: encrypted.iv,
    };

    await expect(decryptAesGcm(key, tamperedData)).rejects.toThrow(
      /Decryption failed or ciphertext was tampered with/
    );
  });

  it("tamper detection: altering IV throws an error", async () => {
    const key = await generateAesKey();
    const secretText = "Confidential note data";
    const encrypted = await encryptAesGcm(key, secretText);

    // Tamper with IV
    const tamperedIvChars = encrypted.iv.split("");
    tamperedIvChars[0] = tamperedIvChars[0] === "A" ? "B" : "A";
    const tamperedData = {
      ciphertext: encrypted.ciphertext,
      iv: tamperedIvChars.join(""),
    };

    await expect(decryptAesGcm(key, tamperedData)).rejects.toThrow(
      /Decryption failed or ciphertext was tampered with/
    );
  });
});

describe("Argon2id Key Derivation", () => {
  it("derives deterministic 256-bit key from passphrase and salt", async () => {
    const passphrase = "MySecureVaultPassword2026!";
    const salt = generateSalt(16);

    // Fast parameters for unit tests
    const res1 = await deriveKeyFromPassphrase(passphrase, salt, 2, 1024);
    const res2 = await deriveKeyFromPassphrase(passphrase, res1.salt, 2, 1024);

    expect(res1.rawKey.byteLength).toBe(32);
    expect(res1.rawKey).toEqual(res2.rawKey);
  });

  it("different passphrases derive completely different keys", async () => {
    const salt = generateSalt(16);
    const res1 = await deriveKeyFromPassphrase("PassphraseA", salt, 2, 1024);
    const res2 = await deriveKeyFromPassphrase("PassphraseB", salt, 2, 1024);

    expect(res1.rawKey).not.toEqual(res2.rawKey);
  });

  it("empty passphrase throws an error", async () => {
    await expect(deriveKeyFromPassphrase("")).rejects.toThrow("Passphrase cannot be empty");
  });

  it("derived key can be imported into Web Crypto and encrypt/decrypt notes", async () => {
    const derived = await deriveKeyFromPassphrase("MyVaultMasterKey", undefined, 2, 1024);
    const cryptoKey = await importAesKey(derived.rawKey);

    const note = "My Super Secret Note";
    const encrypted = await encryptAesGcm(cryptoKey, note);
    const decrypted = await decryptAesGcm(cryptoKey, encrypted);

    expect(decrypted).toBe(note);
  });
});
