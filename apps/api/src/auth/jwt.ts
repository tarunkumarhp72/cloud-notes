import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const DEFAULT_TEST_SECRET = "notepad-cloud-test-jwt-secret-32-bytes-min!!";

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_TEST_SECRET;
  return new TextEncoder().encode(secret);
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  email: string;
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = getJwtSecretKey();
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid access token payload structure");
  }

  return {
    ...payload,
    sub: payload.sub,
    email: payload.email,
  };
}
