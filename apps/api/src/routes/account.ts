import { Hono, type Context } from "hono";
import { deleteCookie } from "hono/cookie";
import { getAuthUserId } from "./sync.js";
import { sql } from "../db.js";
import { inMemoryNotesStore } from "./sync.js";

export const accountRouter = new Hono();

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

const handleDelete = async (c: Context) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to perform account deletion.",
      },
      401
    );
  }

  try {
    if (sql) {
      // Postgres cascade delete automatically purges vaults, encrypted_notes, and sync_log
      await sql`DELETE FROM users WHERE id = ${userId} OR google_sub = ${userId}`;
    } else {
      // Clear in-memory notes store for mock / local test environment
      for (const [key, note] of inMemoryNotesStore.entries()) {
        if (note.userId === userId) {
          inMemoryNotesStore.delete(key);
        }
      }
    }

    // Clear rotating refresh token cookie
    deleteCookie(c, "refresh_token", {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Strict",
    });

    return c.json<DeleteAccountResponse>({
      success: true,
      message: "Account and all associated encrypted notes purged permanently.",
    });
  } catch (err) {
    return c.json(
      {
        error: "Internal Server Error",
        message: err instanceof Error ? err.message : "Failed to delete account",
      },
      500
    );
  }
};

accountRouter.delete("/", handleDelete);
accountRouter.post("/delete", handleDelete);
