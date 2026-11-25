import crypto from "node:crypto";
import zlib from "node:zlib";
import { config } from "../config";

const MAGIC_HEADER = Buffer.from("NOTEPAD_ENC_GZ_v1", "utf-8"); // 17 bytes
const IV_LENGTH = 12; // 96-bit IV standard for AES-GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Derives a dedicated 256-bit key for encrypting backup archives.
 */
function getBackupKey(): Buffer {
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(config.jwt.secret, "utf-8"),
      Buffer.from("notepad-backup-salt-v1", "utf-8"),
      Buffer.from("notepad-backup-archive-key", "utf-8"),
      32
    )
  );
}

/**
 * Compresses an arbitrary JSON object with GZIP and encrypts it with AES-256-GCM.
 * Output layout: [ MAGIC_HEADER (17B) | IV (12B) | AUTH_TAG (16B) | CIPHERTEXT ]
 */
export function sealBackupBundle(payload: object): Buffer {
  const jsonString = JSON.stringify(payload);
  const compressed = zlib.gzipSync(Buffer.from(jsonString, "utf-8"), { level: 9 });

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getBackupKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([MAGIC_HEADER, iv, tag, ciphertext]);
}

/**
 * Authenticates, decrypts, and decompresses an encrypted backup container.
 * Throws an error if the container is tampered with or corrupted.
 */
export function unsealBackupBundle<T = any>(sealedBuffer: Buffer): T {
  if (sealedBuffer.length < MAGIC_HEADER.length + IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid backup container: buffer too small");
  }

  const magic = sealedBuffer.subarray(0, MAGIC_HEADER.length);
  if (!magic.equals(MAGIC_HEADER)) {
    throw new Error("Invalid backup container: unrecognized format header");
  }

  let offset = MAGIC_HEADER.length;
  const iv = sealedBuffer.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const tag = sealedBuffer.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;

  const ciphertext = sealedBuffer.subarray(offset);
  const key = getBackupKey();

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decompressed: Buffer;
  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    decompressed = zlib.gunzipSync(decrypted);
  } catch (err) {
    throw new Error(`Backup decryption failed: authentication failed or corrupted archive (${err instanceof Error ? err.message : String(err)})`);
  }

  return JSON.parse(decompressed.toString("utf-8")) as T;
}
