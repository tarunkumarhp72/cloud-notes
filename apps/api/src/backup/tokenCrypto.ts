import crypto from "node:crypto";
import { config } from "../config.js";

/**
 * Derives a 32-byte AES-256-GCM encryption key from server secrets using HKDF (RFC 5869).
 */
function getEncryptionKey(): Buffer {
  const customKey = process.env.DRIVE_TOKEN_ENCRYPTION_KEY;
  if (customKey && customKey.length >= 32) {
    return Buffer.from(customKey.slice(0, 32), "utf-8");
  }

  // Deterministically derive 256-bit key from config.jwt.secret
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(config.jwt.secret, "utf-8"),
      Buffer.from("notepad-drive-token-salt", "utf-8"),
      Buffer.from("notepad-drive-token-encryption-v1", "utf-8"),
      32
    )
  );
}

/**
 * Encrypts sensitive Google OAuth tokens (access_token, refresh_token) before writing to PostgreSQL.
 * Format: "ivHex:tagHex:ciphertextHex"
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return "";
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts encrypted Google OAuth tokens from PostgreSQL.
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) return "";
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format: expected iv:tag:ciphertext");
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
