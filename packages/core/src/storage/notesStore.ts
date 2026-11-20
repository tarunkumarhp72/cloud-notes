import { getDb, type NotepadDBSchema } from "./db";

export type LocalEncryptedNote = NotepadDBSchema["notes"]["value"];

export async function saveNote(note: LocalEncryptedNote): Promise<void> {
  const db = await getDb();
  await db.put("notes", note);
}

export async function getNote(id: string): Promise<LocalEncryptedNote | undefined> {
  const db = await getDb();
  return db.get("notes", id);
}

export async function listNotes(includeDeleted = false): Promise<LocalEncryptedNote[]> {
  const db = await getDb();
  const allNotes = await db.getAllFromIndex("notes", "by-updated");
  if (includeDeleted) {
    return allNotes;
  }
  return allNotes.filter((note) => !note.deleted);
}

export async function deleteNote(id: string, soft = true): Promise<void> {
  const db = await getDb();
  if (soft) {
    const existing = await db.get("notes", id);
    if (existing) {
      existing.deleted = true;
      existing.clientUpdatedAt = new Date().toISOString();
      existing.syncStatus = "pending";
      await db.put("notes", existing);
    }
  } else {
    await db.delete("notes", id);
  }
}

export async function saveNotesBatch(notes: LocalEncryptedNote[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");

  for (const note of notes) {
    await store.put(note);
  }

  await tx.done;
}
