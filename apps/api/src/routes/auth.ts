import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { signAccessToken, verifyAccessToken } from "../auth/jwt.js";
import { signRefreshToken, rotateRefreshToken, getRefreshCookieOptions } from "../auth/tokens.js";
import { sql } from "../db.js";
import { config } from "../config.js";

export const authRouter = new Hono();

const GoogleAuthSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  codeVerifier: z.string().min(1, "Code verifier is required"),
  redirectUri: z.string().url("Valid redirect URI is required"),
});

export interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export interface GoogleIdTokenClaims {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<GoogleIdTokenClaims> {
  const clientId = config.google.clientId;
  const clientSecret = config.google.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured on server");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokens = (await response.json()) as GoogleTokenResponse;
  
  const parts = tokens.id_token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format returned by Google");
  }

  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as GoogleIdTokenClaims;

  // If picture or display name is missing from ID token, fetch directly from Google UserInfo
  if ((!payload.picture || !payload.name) && tokens.access_token) {
    try {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userinfo = (await userinfoRes.json()) as { picture?: string; name?: string };
        if (userinfo.picture && !payload.picture) {
          payload.picture = userinfo.picture;
        }
        if (userinfo.name && !payload.name) {
          payload.name = userinfo.name;
        }
      }
    } catch {
      // Non-critical fallback
    }
  }

  return payload;
}

export const authHandlers = {
  exchangeGoogleCode,
};

authRouter.post("/google", async (c) => {
  let body;
  try {
    body = GoogleAuthSchema.parse(await c.req.json());
  } catch (err) {
    return c.json({
      error: "Validation error",
      details: err instanceof z.ZodError ? err.issues : String(err),
    }, 400);
  }

  let claims: GoogleIdTokenClaims;
  try {
    claims = await authHandlers.exchangeGoogleCode(body.code, body.codeVerifier, body.redirectUri);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Google authentication failed" }, 401);
  }

  let userId = crypto.randomUUID();
  const email = claims.email;
  let displayName = claims.name || email.split("@")[0];
  let avatarUrl = claims.picture || null;

  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO users (id, google_sub, email, display_name, avatar_url, updated_at)
        VALUES (${userId}, ${claims.sub}, ${email}, ${displayName}, ${avatarUrl}, NOW())
        ON CONFLICT (google_sub) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = COALESCE(EXCLUDED.display_name, users.display_name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
          updated_at = NOW()
        RETURNING id, display_name, avatar_url
      `;
      if (rows && rows.length > 0) {
        userId = rows[0].id;
        displayName = rows[0].display_name || displayName;
        avatarUrl = rows[0].avatar_url || avatarUrl;
      }
    } catch {
      // In tests or offline mode, continue with generated userId
    }
  }

  const accessToken = await signAccessToken(userId, email);
  const { token: refreshToken } = await signRefreshToken(userId, email);

  const cookieOpts = getRefreshCookieOptions(refreshToken);
  setCookie(c, cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    maxAge: cookieOpts.maxAge,
    path: cookieOpts.path,
  });

  return c.json({
    accessToken,
    user: {
      id: userId,
      email,
      displayName,
      avatarUrl,
    },
  });
});

authRouter.get("/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const errorDesc = c.req.query("error_description");

  const frontendOrigin = config.frontendUrl;

  if (error) {
    return c.redirect(`${frontendOrigin}/?error=${encodeURIComponent(errorDesc || error)}`);
  }

  if (!code) {
    return c.redirect(`${frontendOrigin}/?error=Missing+authorization+code`);
  }

  try {
    const reqUrl = new URL(c.req.url);
    const redirectUri = `${reqUrl.origin}/auth/callback`;
    const clientId = config.google.clientId;
    const clientSecret = config.google.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured on server");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.redirect(`${frontendOrigin}/?error=${encodeURIComponent("Google token exchange error: " + errText)}`);
    }

    const tokens = (await response.json()) as GoogleTokenResponse;
    const parts = tokens.id_token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid ID token format returned by Google");
    }

    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as GoogleIdTokenClaims;

    // Fetch userinfo if picture or name is missing from ID token
    if ((!claims.picture || !claims.name) && tokens.access_token) {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userinfoRes.ok) {
          const userinfo = (await userinfoRes.json()) as { picture?: string; name?: string };
          if (userinfo.picture && !claims.picture) {
            claims.picture = userinfo.picture;
          }
          if (userinfo.name && !claims.name) {
            claims.name = userinfo.name;
          }
        }
      } catch {
        // Non-critical fallback
      }
    }

    let userId = crypto.randomUUID();
    const email = claims.email;
    let displayName = claims.name || email.split("@")[0];
    let avatarUrl = claims.picture || null;

    if (sql) {
      try {
        const rows = await sql`
          INSERT INTO users (id, google_sub, email, display_name, avatar_url, updated_at)
          VALUES (${userId}, ${claims.sub}, ${email}, ${displayName}, ${avatarUrl}, NOW())
          ON CONFLICT (google_sub) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(EXCLUDED.display_name, users.display_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
            updated_at = NOW()
          RETURNING id, display_name, avatar_url
        `;
        if (rows && rows.length > 0) {
          userId = rows[0].id;
          displayName = rows[0].display_name || displayName;
          avatarUrl = rows[0].avatar_url || avatarUrl;
        }
      } catch {}
    }

    const accessToken = await signAccessToken(userId, email);
    const { token: refreshToken } = await signRefreshToken(userId, email);

    const cookieOpts = getRefreshCookieOptions(refreshToken);
    setCookie(c, cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    });

    const userParam = encodeURIComponent(
      JSON.stringify({
        id: userId,
        email,
        displayName,
        avatarUrl,
      })
    );

    return c.redirect(`${frontendOrigin}/?token=${accessToken}&user=${userParam}`);
  } catch (err) {
    return c.redirect(
      `${frontendOrigin}/?error=${encodeURIComponent(err instanceof Error ? err.message : "Authentication failed")}`
    );
  }
});

authRouter.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, "refresh_token") || c.req.header("X-Refresh-Token");
  if (!refreshToken) {
    return c.json({ error: "Missing refresh token" }, 401);
  }

  try {
    const rotated = await rotateRefreshToken(refreshToken);

    const cookieOpts = getRefreshCookieOptions(rotated.newRefreshToken);
    setCookie(c, cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    });

    return c.json({
      accessToken: rotated.newAccessToken,
      userId: rotated.userId,
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Invalid or revoked refresh token" }, 401);
  }
});

authRouter.post("/logout", async (c) => {
  deleteCookie(c, "refresh_token", { path: "/auth" });
  return c.json({ success: true, message: "Logged out successfully" });
});

authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyAccessToken(token);
    let displayName = payload.email.split("@")[0];
    let avatarUrl: string | null = null;

    if (sql) {
      try {
        const rows = await sql`
          SELECT display_name, avatar_url FROM users
          WHERE id = ${payload.sub} OR email = ${payload.email}
          ORDER BY avatar_url NULLS LAST, updated_at DESC
          LIMIT 1
        `;
        if (rows.length > 0) {
          displayName = rows[0].display_name || displayName;
          avatarUrl = rows[0].avatar_url || null;
        }
      } catch {
        // Non-fatal database fallback
      }
    }

    return c.json({
      user: {
        id: payload.sub,
        email: payload.email,
        displayName,
        avatarUrl,
      },
    });
  } catch {
    return c.json({ error: "Invalid or expired access token" }, 401);
  }
});
