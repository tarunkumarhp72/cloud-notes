import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config, tokenVerificationCache } from "../config";

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(config.jwt.secret);
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  email: string;
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: config.jwt.algorithm })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(config.jwt.accessExpiresIn)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  // Check LRU cache first to prevent repeated crypto operations on high-frequency requests
  const cached = tokenVerificationCache.get(token);
  if (cached) {
    return cached as AccessTokenPayload;
  }

  const secret = getJwtSecretKey();
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [config.jwt.algorithm],
  });

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid access token payload structure");
  }

  const verified: AccessTokenPayload = {
    ...payload,
    sub: payload.sub,
    email: payload.email,
  };

  // Cache verified payload in LRU cache
  tokenVerificationCache.set(token, verified);
  return verified;
}
