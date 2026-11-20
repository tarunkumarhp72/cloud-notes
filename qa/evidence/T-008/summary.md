# Task Evidence: T-008 Backend Auth Endpoints

## Task Overview
- **Task ID:** T-008
- **Phase:** Phase 2 - Authentication & Identity
- **Goal:** Expose `/auth/google` (code exchange), `/auth/refresh` (cookie rotation), `/auth/logout`, `/auth/me` endpoints on Hono API.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/api/src/routes/auth.ts`:
  - `POST /auth/google`: Validates `{ code, codeVerifier, redirectUri }`, exchanges code via Google token API, upserts user in database, signs access JWT (15m), signs refresh token (15d), sets httpOnly SameSite=Strict cookie, returns access token + user profile.
  - `POST /auth/refresh`: Reads `refresh_token` cookie or `X-Refresh-Token` header, rotates refresh token with replay-detection, issues fresh access token and new rotated refresh cookie.
  - `POST /auth/logout`: Clears the refresh token cookie (`Max-Age=0`).
  - `GET /auth/me`: Verifies Bearer JWT and returns user payload (`id`, `email`).
- `apps/api/src/index.ts`: Mounted `authRouter` at `/auth`.
- `apps/api/src/routes/auth.test.ts`: Unit test suite covering all endpoints with mocking.

## Verification
- Lint: PASS (0 errors, 0 warnings)
- Typecheck: PASS (`tsc --noEmit` across all 4 workspaces)
- Unit Tests: PASS (11/11 tests passed in `@notepad/api`, 32/32 tests across monorepo)
- Security Verification: All secrets read strictly from `process.env`. Zero hardcoded secrets in code or git.
