import { Hono, type Context } from "hono";
import { z } from "zod";
import { verifyAccessToken } from "../auth/jwt";
import { sql } from "../db";

export const syncRouter = new Hono();

export const SyncPushMutationSchema = z.object({
  id: z.string().min(1, "Mutation ID is required"),
  noteId: z.string().min(1, "Note ID is required"),
  action: z.enum(["upsert", "delete"]),
  encryptedEnvelope: z.string().min(1, "Encrypted envelope is required"),
  version: z.number().int().nonnegative().optional().default(1),
  clientUpdatedAt: z.string().min(1, "Client updated at is required"),
});

export const SyncPushRequestSchema = z.object({
  mutations: z.array(SyncPushMutationSchema).min(1, "At least one mutation is required"),
});

export interface SyncedMutationResult {
  mutationId: string;
  noteId: string;
  version: number;
  updatedAt: string;
}

export interface StoredEncryptedNote {
  id: string;
  userId: string;
  encryptedEnvelope: string;
  version: number;
  clientUpdatedAt: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory store fallback for offline mode / unit testing when Postgres pooler is unavailable
export const inMemoryNotesStore = new Map<string, StoredEncryptedNote>();

export async function getAuthUserId(c: Context): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  try {
    const payload = await verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export const syncHandlers = {
  async processPushMutations(
    userId: string,
    mutations: z.infer<typeof SyncPushMutationSchema>[]
  ): Promise<SyncedMutationResult[]> {
    const results: SyncedMutationResult[] = [];

    for (const m of mutations) {
      const nowIso = new Date().toISOString();

      if (sql) {
        if (m.action === "upsert") {
          const rows = await sql`
            INSERT INTO encrypted_notes (
              id,
              user_id,
              encrypted_envelope,
              version,
              client_updated_at,
              deleted,
              updated_at
            )
            VALUES (
              ${m.noteId},
              ${userId},
              ${m.encryptedEnvelope},
              ${m.version},
              ${m.clientUpdatedAt},
              FALSE,
              NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              encrypted_envelope = EXCLUDED.encrypted_envelope,
              version = encrypted_notes.version + 1,
              client_updated_at = EXCLUDED.client_updated_at,
              deleted = FALSE,
              updated_at = NOW()
            RETURNING id, version, updated_at
          `;

          const row = rows[0];
          const ver = row ? Number(row.version) : m.version;
          const upAt = row?.updated_at ? new Date(row.updated_at).toISOString() : nowIso;

          // Record sync log
          try {
            await sql`
              INSERT INTO sync_log (user_id, note_id, version, synced_at)
              VALUES (${userId}, ${m.noteId}, ${ver}, NOW())
            `;
          } catch {
            // Non-critical log
          }

          results.push({
            mutationId: m.id,
            noteId: m.noteId,
            version: ver,
            updatedAt: upAt,
          });
        } else {
          // action === 'delete'
          const rows = await sql`
            UPDATE encrypted_notes
            SET
              deleted = TRUE,
              version = version + 1,
              updated_at = NOW(),
              client_updated_at = ${m.clientUpdatedAt}
            WHERE id = ${m.noteId} AND user_id = ${userId}
            RETURNING id, version, updated_at
          `;

          const row = rows[0];
          const ver = row ? Number(row.version) : m.version + 1;
          const upAt = row?.updated_at ? new Date(row.updated_at).toISOString() : nowIso;

          results.push({
            mutationId: m.id,
            noteId: m.noteId,
            version: ver,
            updatedAt: upAt,
          });
        }
      } else {
        // Fallback in-memory behavior
        const existingKey = `${userId}:${m.noteId}`;
        const existing = inMemoryNotesStore.get(existingKey);
        const newVersion = existing ? existing.version + 1 : m.version;

        const updatedRecord: StoredEncryptedNote = {
          id: m.noteId,
          userId,
          encryptedEnvelope: m.encryptedEnvelope,
          version: newVersion,
          clientUpdatedAt: m.clientUpdatedAt,
          deleted: m.action === "delete",
          createdAt: existing?.createdAt || nowIso,
          updatedAt: nowIso,
        };

        inMemoryNotesStore.set(existingKey, updatedRecord);
        results.push({
          mutationId: m.id,
          noteId: m.noteId,
          version: newVersion,
          updatedAt: nowIso,
        });
      }
    }

    return results;
  },

  async fetchPulledNotes(
    userId: string,
    since?: string,
    limit = 50
  ): Promise<{ notes: StoredEncryptedNote[]; cursor: string; hasMore: boolean }> {
    if (sql) {
      const rows = since
        ? await sql`
            SELECT id, user_id, encrypted_envelope, version, client_updated_at, deleted, created_at, updated_at
            FROM encrypted_notes
            WHERE user_id = ${userId} AND updated_at > ${since}
            ORDER BY updated_at ASC
            LIMIT ${limit + 1}
          `
        : await sql`
            SELECT id, user_id, encrypted_envelope, version, client_updated_at, deleted, created_at, updated_at
            FROM encrypted_notes
            WHERE user_id = ${userId}
            ORDER BY updated_at ASC
            LIMIT ${limit + 1}
          `;

      const hasMore = rows.length > limit;
      const returnedRows = hasMore ? rows.slice(0, limit) : rows;

      const notes: StoredEncryptedNote[] = returnedRows.map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        encryptedEnvelope: String(r.encrypted_envelope),
        version: Number(r.version),
        clientUpdatedAt: new Date(r.client_updated_at).toISOString(),
        deleted: Boolean(r.deleted),
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      }));

      const lastNote = notes[notes.length - 1];
      const cursor = lastNote ? lastNote.updatedAt : since || new Date().toISOString();

      return { notes, cursor, hasMore };
    }

    // In-memory fallback
    const userNotes: StoredEncryptedNote[] = [];
    for (const record of inMemoryNotesStore.values()) {
      if (record.userId === userId) {
        if (!since || record.updatedAt > since) {
          userNotes.push(record);
        }
      }
    }

    userNotes.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const hasMore = userNotes.length > limit;
    const notes = hasMore ? userNotes.slice(0, limit) : userNotes;
    const last = notes[notes.length - 1];
    const cursor = last ? last.updatedAt : since || new Date().toISOString();

    return { notes, cursor, hasMore };
  },
};

/**
 * POST /sync/push
 * Validates ciphertext payload with Zod and stores versioned note record.
 */
syncRouter.post("/push", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = SyncPushRequestSchema.parse(await c.req.json());
  } catch (err) {
    return c.json(
      {
        error: "Validation error",
        details: err instanceof z.ZodError ? err.issues : String(err),
      },
      400
    );
  }

  try {
    const synced = await syncHandlers.processPushMutations(userId, body.mutations);
    const cursor = new Date().toISOString();
    return c.json({
      status: "ok",
      synced,
      cursor,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync push failed";
    return c.json({ error: msg }, 500);
  }
});

/**
 * GET /sync/pull
 * Returns updates newer than client's last sync cursor.
 */
syncRouter.get("/pull", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const since = c.req.query("since");
  const limitParam = c.req.query("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200) : 50;

  try {
    const result = await syncHandlers.fetchPulledNotes(userId, since, limit);
    return c.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync pull failed";
    return c.json({ error: msg }, 500);
  }
});
