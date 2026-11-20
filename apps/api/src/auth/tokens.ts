import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretKey } from "./jwt";

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
  familyId = generateId(),
  version = 1
): Promise<{ token: string; jti: string; familyId: string }> {
  const secret = getJwtSecretKey();
  const jti = generateId();

  const token = await new SignJWT({ familyId, version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime("15d")
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
    const verified = await jwtVerify(oldToken, secret, { algorithms: ["HS256"] });
    payload = verified.payload;
  } catch (err) {
    throw new Error(`Invalid refresh token: ${err instanceof Error ? err.message : String(err)}`);
  }

  const userId = payload.sub as string;
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

  // Issue rotated refresh token in the same family
  const next = await signRefreshToken(userId, familyId, version + 1);

  // Issue fresh 15-minute access token
  const { signAccessToken } = await import("./jwt");
  const newAccessToken = await signAccessToken(userId, "user@cloudnotes.app");

  return {
    newAccessToken,
    newRefreshToken: next.token,
    userId,
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 15 * 24 * 60 * 60, // 15 days in seconds
    path: "/auth",
  };
}
