import { argon2id } from "hash-wasm";

export interface DerivedKeyResult {
  rawKey: Uint8Array;
  salt: string;
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateSalt(length = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  saltInput?: Uint8Array | string,
  iterations = 3,
  memorySize = 64 * 1024
): Promise<DerivedKeyResult> {
  if (!passphrase) {
    throw new Error("Passphrase cannot be empty");
  }

  let saltBytes: Uint8Array;
  let saltHex: string;

  if (!saltInput) {
    saltBytes = generateSalt(16);
    saltHex = bufferToHex(saltBytes);
  } else if (typeof saltInput === "string") {
    saltHex = saltInput;
    saltBytes = hexToBuffer(saltInput);
  } else {
    saltBytes = saltInput;
    saltHex = bufferToHex(saltBytes);
  }

  // Derive 32 bytes (256 bits) for AES-256
  const hashHex = await argon2id({
    password: passphrase,
    salt: saltBytes,
    parallelism: 1,
    iterations,
    memorySize, // in KB (e.g. 64MB = 65536)
    hashLength: 32,
    outputType: "hex",
  });

  return {
    rawKey: hexToBuffer(hashHex),
    salt: saltHex,
  };
}
