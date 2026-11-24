import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretKey } from "./jwt";
import { config } from "../config";

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // unique token ID
  familyId: string; // token family for rotation & replay detection
  version: number;
}

// In-memory token family registry (used for verification & replay detection)
// In production, syncs with Postgres sessions table
const revokedFamilies = new Set<string>();
const activeTokenIds = new Map<string, { userId: string; familyId: string; version: number }>();

export function clearTokenRegistry(): void {
  revokedFamilies.clear();
  activeTokenIds.clear();
}

function generateId(): string {
  return crypto.randomUUID();
}

export async function signRefreshToken(
  userId: string,
  email?: string,
  familyId = generateId(),
  version = 1
): Promise<{ token: string; jti: string; familyId: string }> {
  const secret = getJwtSecretKey();
  const jti = generateId();

  const token = await new SignJWT({ email, familyId, version })
    .setProtectedHeader({ alg: config.jwt.algorithm })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(config.jwt.refreshExpiresIn)
    .sign(secret);

  activeTokenIds.set(jti, { userId, familyId, version });

  return { token, jti, familyId };
}

export async function rotateRefreshToken(oldToken: string): Promise<{
  newAccessToken: string;
  newRefreshToken: string;
  userId: string;
  email?: string;
}> {
  const secret = getJwtSecretKey();
  let payload;

  try {
    const verified = await jwtVerify(oldToken, secret, { algorithms: [config.jwt.algorithm] });
    payload = verified.payload;
  } catch (err) {
    throw new Error(`Invalid refresh token: ${err instanceof Error ? err.message : String(err)}`);
  }

  const userId = payload.sub as string;
  let email = payload.email as string | undefined;
  const jti = payload.jti as string;
  const familyId = payload.familyId as string;
  const version = (payload.version as number) || 1;

  if (revokedFamilies.has(familyId)) {
    throw new Error("Token replay detected: family revoked. Please log in again.");
  }

  const activeEntry = activeTokenIds.get(jti);
  if (!activeEntry) {
    // Replay attack: token was already rotated or revoked!
    revokedFamilies.add(familyId);
    throw new Error("Token replay detected: token was already used. All family sessions revoked.");
  }

  // Invalidate consumed token
  activeTokenIds.delete(jti);

  // If email was not stored in refresh token, look up the user's real email
  if (!email) {
    const { sql } = await import("../db");
    if (sql) {
      try {
        const rows = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
        if (rows.length > 0 && rows[0].email) {
          email = rows[0].email;
        }
      } catch {
        // Fallback
      }
    }
  }

  // Issue rotated refresh token in the same family
  const next = await signRefreshToken(userId, email, familyId, version + 1);

  // Issue fresh access token with user's verified email
  const { signAccessToken } = await import("./jwt");
  const newAccessToken = await signAccessToken(userId, email || "");

  return {
    newAccessToken,
    newRefreshToken: next.token,
    userId,
    email,
  };
}

export interface RefreshCookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict";
  maxAge: number;
  path: string;
}

export function getRefreshCookieOptions(token: string): RefreshCookieOptions {
  return {
    name: "refresh_token",
    value: token,
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite as "Strict",
    maxAge: config.cookies.refreshMaxAgeSec,
    path: config.cookies.refreshPath,
  };
}
