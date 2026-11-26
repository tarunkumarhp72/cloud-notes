import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "./tokenCrypto.js";
import { sealBackupBundle, unsealBackupBundle } from "./backupCrypto.js";

describe("Token Cryptography (AES-256-GCM at rest)", () => {
  it("encrypts and decrypts OAuth tokens accurately", () => {
    const rawRefreshToken = "1//04ABC123xyz_SampleGoogleRefreshToken-Value";
    const encrypted = encryptToken(rawRefreshToken);

    expect(encrypted).not.toBe(rawRefreshToken);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(rawRefreshToken);
  });

  it("handles empty strings safely", () => {
    expect(encryptToken("")).toBe("");
    expect(decryptToken("")).toBe("");
  });

  it("throws on corrupted token ciphertext", () => {
    const valid = encryptToken("test-token");
    const corrupted = valid.slice(0, -4) + "ffff";
    expect(() => decryptToken(corrupted)).toThrow();
  });
});

describe("Backup Container Cryptography (GZIP + AES-256-GCM)", () => {
  it("seals and unseals structured notes backup accurately", () => {
    const samplePayload = {
      app: "Notepad Cloud",
      version: "1.0",
      backupType: "daily",
      timestamp: new Date().toISOString(),
      notes: [
        {
          id: "note-1",
          encryptedEnvelope: "{\"title\":\"Secret\",\"content\":\"Hello World\"}",
          version: 1,
          clientUpdatedAt: new Date().toISOString(),
        },
        {
          id: "note-2",
          encryptedEnvelope: "{\"title\":\"Work Plan\",\"content\":\"Finish Google Drive\"}",
          version: 2,
          clientUpdatedAt: new Date().toISOString(),
        },
      ],
    };

    const sealed = sealBackupBundle(samplePayload);
    expect(Buffer.isBuffer(sealed)).toBe(true);
    expect(sealed.length).toBeGreaterThan(45); // Header + IV + Tag + payload

    // Magic header verification
    expect(sealed.subarray(0, 17).toString("utf-8")).toBe("NOTEPAD_ENC_GZ_v1");

    const unsealed = unsealBackupBundle(sealed);
    expect(unsealed).toEqual(samplePayload);
    expect(unsealed.notes).toHaveLength(2);
  });

  it("fails when magic header is altered", () => {
    const sealed = sealBackupBundle({ test: "data" });
    sealed[0] = 0x58; // corrupt 'N'
    expect(() => unsealBackupBundle(sealed)).toThrow("unrecognized format header");
  });

  it("fails when payload ciphertext is tampered (AES-GCM auth tag verification)", () => {
    const sealed = sealBackupBundle({ sensitive: "data" });
    // Flip a byte in ciphertext (after 17 bytes header + 12 IV + 16 Tag = offset 45)
    sealed[sealed.length - 1] ^= 0x01;
    expect(() => unsealBackupBundle(sealed)).toThrow("Backup decryption failed");
  });
});
