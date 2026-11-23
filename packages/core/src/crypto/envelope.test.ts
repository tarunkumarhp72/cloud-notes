import { describe, it, expect } from "vitest";
import { generateAesKey } from "./aes";
import {
  createNoteEnvelope,
  openNoteEnvelope,
  packEncryptedNote,
  unpackEncryptedNote,
  ENVELOPE_VERSION,
  ENVELOPE_ALGORITHM,
  type PlaintextNote,
} from "./envelope";

describe("Note Envelope Encryption Pipeline (T-031)", () => {
  const sampleNote: PlaintextNote = {
    id: "note-uuid-12345",
    title: "Zero-Knowledge Secret Note",
    content: "This secret text will never be stored or transmitted in plaintext.",
    isMarkdown: true,
    createdAt: "2026-11-23T10:00:00.000Z",
    updatedAt: "2026-11-23T10:05:00.000Z",
  };

  it("wraps plaintext note into an AES-256-GCM envelope with unique IV and auth tag", async () => {
    const key = await generateAesKey();
    const env1 = await createNoteEnvelope(key, sampleNote);
    const env2 = await createNoteEnvelope(key, sampleNote);

    expect(env1.version).toBe(ENVELOPE_VERSION);
    expect(env1.algorithm).toBe(ENVELOPE_ALGORITHM);
    expect(env1.ciphertext).toBeDefined();
    expect(env1.iv).toBeDefined();
    expect(env1.authTag).toBeDefined();

    // Random IV guarantee: identical plaintext results in distinct IVs and ciphertexts
    expect(env1.iv).not.toEqual(env2.iv);
    expect(env1.ciphertext).not.toEqual(env2.ciphertext);

    // IV base64 length is 16 chars (12 raw bytes = 16 base64 chars)
    expect(atob(env1.iv).length).toBe(12);

    // Auth tag base64 length is 24 chars (16 raw bytes = 24 base64 chars with padding)
    expect(atob(env1.authTag).length).toBe(16);
  });

  it("decrypts note envelope seamlessly", async () => {
    const key = await generateAesKey();
    const envelope = await createNoteEnvelope(key, sampleNote);
    const decrypted = await openNoteEnvelope(key, envelope);

    expect(decrypted).toEqual(sampleNote);
  });

  it("decrypts note envelope from JSON serialized string", async () => {
    const key = await generateAesKey();
    const envelope = await createNoteEnvelope(key, sampleNote);
    const serialized = JSON.stringify(envelope);

    const decrypted = await openNoteEnvelope(key, serialized);
    expect(decrypted).toEqual(sampleNote);
  });

  it("rejects decryption if ciphertext has been tampered with", async () => {
    const key = await generateAesKey();
    const envelope = await createNoteEnvelope(key, sampleNote);

    // Tamper with ciphertext by corrupting a byte
    const rawCipher = atob(envelope.ciphertext);
    const tamperedCipher =
      rawCipher.substring(0, 2) +
      String.fromCharCode((rawCipher.charCodeAt(2) + 1) % 256) +
      rawCipher.substring(3);
    const tamperedEnvelope = {
      ...envelope,
      ciphertext: btoa(tamperedCipher),
    };

    await expect(openNoteEnvelope(key, tamperedEnvelope)).rejects.toThrow();
  });

  it("rejects decryption if authentication tag has been tampered with", async () => {
    const key = await generateAesKey();
    const envelope = await createNoteEnvelope(key, sampleNote);

    const rawTag = atob(envelope.authTag);
    const tamperedTag =
      String.fromCharCode((rawTag.charCodeAt(0) + 1) % 256) + rawTag.substring(1);
    const tamperedEnvelope = {
      ...envelope,
      authTag: btoa(tamperedTag),
    };

    await expect(openNoteEnvelope(key, tamperedEnvelope)).rejects.toThrow();
  });

  it("rejects decryption if IV has been altered", async () => {
    const key = await generateAesKey();
    const envelope = await createNoteEnvelope(key, sampleNote);

    const rawIv = atob(envelope.iv);
    const tamperedIv =
      String.fromCharCode((rawIv.charCodeAt(0) + 1) % 256) + rawIv.substring(1);
    const tamperedEnvelope = {
      ...envelope,
      iv: btoa(tamperedIv),
    };

    await expect(openNoteEnvelope(key, tamperedEnvelope)).rejects.toThrow();
  });

  it("rejects decryption when attempted with a different key", async () => {
    const correctKey = await generateAesKey();
    const wrongKey = await generateAesKey();

    const envelope = await createNoteEnvelope(correctKey, sampleNote);
    await expect(openNoteEnvelope(wrongKey, envelope)).rejects.toThrow();
  });

  it("packs and unpacks LocalEncryptedNote cleanly for storage", async () => {
    const key = await generateAesKey();
    const packed = await packEncryptedNote(key, sampleNote, {
      version: 3,
      syncStatus: "pending",
      deleted: false,
    });

    expect(packed.id).toBe(sampleNote.id);
    expect(packed.version).toBe(3);
    expect(packed.syncStatus).toBe("pending");
    expect(packed.deleted).toBe(false);

    // Verify plaintext does NOT appear anywhere in the stored record
    expect(packed.encryptedEnvelope).not.toContain("Zero-Knowledge Secret Note");
    expect(packed.encryptedEnvelope).not.toContain("This secret text");

    const unpacked = await unpackEncryptedNote(key, packed);
    expect(unpacked).toEqual(sampleNote);
  });
});
