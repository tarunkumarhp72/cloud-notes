import { encryptAesGcm, decryptAesGcm } from "./aes";
import type { LocalEncryptedNote } from "../storage/notesStore";

export interface PlaintextNote {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteEnvelope {
  version: number;
  algorithm: "AES-256-GCM";
  iv: string; // base64 12-byte IV
  ciphertext: string; // base64 encrypted payload (without auth tag)
  authTag: string; // base64 16-byte (128-bit) authentication tag
  createdAt: string;
}

export const ENVELOPE_VERSION = 1;
export const ENVELOPE_ALGORITHM = "AES-256-GCM";

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Encrypts a plaintext note into a tamper-evident AES-256-GCM envelope
 * with a unique 12-byte IV and 128-bit authentication tag.
 */
export async function createNoteEnvelope(
  key: CryptoKey,
  note: PlaintextNote
): Promise<NoteEnvelope> {
  const serialized = JSON.stringify(note);
  const encrypted = await encryptAesGcm(key, serialized);

  const fullBytes = base64ToBuffer(encrypted.ciphertext);
  if (fullBytes.length < 16) {
    throw new Error("Invalid ciphertext length: missing authentication tag");
  }

  // Web Crypto AES-GCM appends 16-byte authentication tag to ciphertext
  const cipherBytes = fullBytes.slice(0, fullBytes.length - 16);
  const tagBytes = fullBytes.slice(fullBytes.length - 16);

  return {
    version: ENVELOPE_VERSION,
    algorithm: ENVELOPE_ALGORITHM,
    iv: encrypted.iv,
    ciphertext: bufferToBase64(cipherBytes),
    authTag: bufferToBase64(tagBytes),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypts and verifies the integrity of an encrypted note envelope.
 * Throws an error if authentication fails, IV is incorrect, or ciphertext is tampered with.
 */
export async function openNoteEnvelope(
  key: CryptoKey,
  envelopeInput: NoteEnvelope | string
): Promise<PlaintextNote> {
  let envelope: NoteEnvelope;
  if (typeof envelopeInput === "string") {
    try {
      envelope = JSON.parse(envelopeInput);
    } catch {
      throw new Error("Invalid note envelope JSON format");
    }
  } else {
    envelope = envelopeInput;
  }

  if (envelope.algorithm !== ENVELOPE_ALGORITHM) {
    throw new Error(`Unsupported encryption algorithm: ${envelope.algorithm}`);
  }

  const cipherBytes = base64ToBuffer(envelope.ciphertext);
  const tagBytes = base64ToBuffer(envelope.authTag);

  // Combine cipher bytes and authentication tag for Web Crypto subtle.decrypt
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
  combined.set(cipherBytes, 0);
  combined.set(tagBytes, cipherBytes.length);

  const decryptedJson = await decryptAesGcm(key, {
    ciphertext: bufferToBase64(combined),
    iv: envelope.iv,
  });

  const parsed = JSON.parse(decryptedJson) as PlaintextNote;
  if (!parsed || typeof parsed.id !== "string") {
    throw new Error("Decrypted note payload is missing required id");
  }

  return parsed;
}

export interface PackOptions {
  version?: number;
  syncStatus?: "synced" | "pending" | "conflict";
  deleted?: boolean;
}

/**
 * Packs a plaintext note into a LocalEncryptedNote suitable for IndexedDB or outbox syncing.
 * Plaintext note contents never leave memory unencrypted.
 */
export async function packEncryptedNote(
  key: CryptoKey,
  note: PlaintextNote,
  options?: PackOptions
): Promise<LocalEncryptedNote> {
  const envelope = await createNoteEnvelope(key, note);
  return {
    id: note.id,
    encryptedEnvelope: JSON.stringify(envelope),
    version: options?.version ?? 1,
    clientUpdatedAt: note.updatedAt || new Date().toISOString(),
    deleted: options?.deleted ?? false,
    syncStatus: options?.syncStatus ?? "pending",
  };
}

/**
 * Unpacks and decrypts a LocalEncryptedNote stored in IndexedDB.
 */
export async function unpackEncryptedNote(
  key: CryptoKey,
  record: LocalEncryptedNote
): Promise<PlaintextNote> {
  return openNoteEnvelope(key, record.encryptedEnvelope);
}
