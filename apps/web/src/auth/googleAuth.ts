// Google OAuth 2.0 PKCE URL Builder and Callback Validator

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
  storePkceSession,
  retrievePkceSession,
} from "./pkce";

export interface GoogleAuthOptions {
  clientId: string;
  redirectUri: string;
  state?: string;
  scope?: string;
}

export interface GoogleAuthUrlResult {
  url: string;
  state: string;
  verifier: string;
  challenge: string;
}

export async function buildGoogleAuthUrl(options: GoogleAuthOptions): Promise<GoogleAuthUrlResult> {
  const state = options.state || generateRandomString(32);
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  storePkceSession(state, verifier);

  const scope = options.scope || "openid email profile";
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state,
    verifier,
    challenge,
  };
}

export interface CallbackValidationResult {
  code: string;
  verifier: string;
}

export function validateGoogleCallback(
  searchParams: URLSearchParams,
  expectedState: string
): CallbackValidationResult {
  const error = searchParams.get("error");
  if (error) {
    const errorDesc = searchParams.get("error_description") || error;
    throw new Error(`Google OAuth error: ${errorDesc}`);
  }

  const callbackState = searchParams.get("state");
  if (!callbackState || callbackState !== expectedState) {
    throw new Error("Invalid state parameter: possible CSRF attempt");
  }

  const code = searchParams.get("code");
  if (!code) {
    throw new Error("Missing authorization code in Google callback");
  }

  const verifier = retrievePkceSession(expectedState);
  if (!verifier) {
    throw new Error("PKCE code verifier not found or expired for this state");
  }

  return { code, verifier };
}
