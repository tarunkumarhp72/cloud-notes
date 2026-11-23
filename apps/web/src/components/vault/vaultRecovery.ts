import {
  importAesKey,
  exportAesKey,
  encryptAesGcm,
  decryptAesGcm,
  type EncryptedData,
} from "@notepad/core";

/**
 * Generates 32 bytes (256 bits) of cryptographically secure random entropy
 * for emergency vault recovery.
 */
export function generateRawRecoveryKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Formats a 32-byte recovery key into 16 groups of 4 uppercase hex characters:
 * e.g., "A1B2-C3D4-E5F6-7890-..." (64 hex characters total).
 */
export function formatRecoveryKey(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  const chunks = hex.match(/.{1,4}/g);
  return chunks ? chunks.join("-") : hex;
}

/**
 * Normalizes user input (strips hyphens, whitespace, and validates 64-char hex)
 * and returns raw 32 bytes.
 */
export function normalizeRecoveryKey(input: string): Uint8Array {
  const cleanHex = input.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  if (cleanHex.length !== 64) {
    throw new Error("Invalid recovery key: must be 64 hexadecimal characters");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from the 32-byte recovery secret using SHA-256.
 */
export async function deriveRecoveryAesKey(recoveryBytes: Uint8Array): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(recoveryBytes));
  return importAesKey(new Uint8Array(digest));
}

/**
 * Wraps (encrypts) the vault master key using the recovery key.
 * Returns a JSON string of EncryptedData containing { ciphertext, iv }.
 */
export async function wrapVaultKeyWithRecovery(
  vaultKey: CryptoKey,
  recoveryBytes: Uint8Array
): Promise<string> {
  const recoveryAesKey = await deriveRecoveryAesKey(recoveryBytes);
  const rawVaultKey = await exportAesKey(vaultKey);
  const rawVaultKeyHex = Array.from(rawVaultKey)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const encrypted: EncryptedData = await encryptAesGcm(recoveryAesKey, rawVaultKeyHex);
  return JSON.stringify(encrypted);
}

/**
 * Unwraps (decrypts) the vault master key using the user-provided recovery key.
 * Throws an error if the recovery key is invalid or ciphertext is tampered with.
 */
export async function unwrapVaultKeyWithRecovery(
  recoveryKeyInput: string,
  recoveryVerifierJson: string
): Promise<CryptoKey> {
  const recoveryBytes = normalizeRecoveryKey(recoveryKeyInput);
  const recoveryAesKey = await deriveRecoveryAesKey(recoveryBytes);
  const encrypted: EncryptedData = JSON.parse(recoveryVerifierJson);
  const decryptedHex = await decryptAesGcm(recoveryAesKey, encrypted);

  if (decryptedHex.length !== 64) {
    throw new Error("Corrupted or invalid decrypted vault key");
  }

  const rawKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    rawKey[i] = parseInt(decryptedHex.substring(i * 2, i * 2 + 2), 16);
  }
  return importAesKey(rawKey);
}
