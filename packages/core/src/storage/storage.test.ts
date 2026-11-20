import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveNote,
  getNote,
  listNotes,
  deleteNote,
  saveNotesBatch,
  closeDb,
  type LocalEncryptedNote,
} from "./index";

describe("IndexedDB Encrypted Notes Store", () => {
  beforeEach(async () => {
    await closeDb();
    indexedDB.deleteDatabase("notepad_cloud_db");
  });

  afterEach(async () => {
    await closeDb();
    indexedDB.deleteDatabase("notepad_cloud_db");
  });

  it("stores and retrieves a note by UUIDv7 ID", async () => {
    const noteId = "01934c2b-88a2-73a1-b84a-923f03b2241b";
    const note: LocalEncryptedNote = {
      id: noteId,
      encryptedEnvelope: "mock-iv:mock-ciphertext:mock-tag",
      version: 1,
      clientUpdatedAt: new Date().toISOString(),
      deleted: false,
      syncStatus: "pending",
    };

    await saveNote(note);
    const retrieved = await getNote(noteId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(noteId);
    expect(retrieved?.encryptedEnvelope).toBe(note.encryptedEnvelope);
    expect(retrieved?.version).toBe(1);
    expect(retrieved?.syncStatus).toBe("pending");
  });

  it("lists only active notes by default and includes deleted when requested", async () => {
    const note1: LocalEncryptedNote = {
      id: "note-1",
      encryptedEnvelope: "env-1",
      version: 1,
      clientUpdatedAt: "2026-11-20T10:00:00.000Z",
      deleted: false,
      syncStatus: "synced",
    };

    const note2: LocalEncryptedNote = {
      id: "note-2",
      encryptedEnvelope: "env-2",
      version: 1,
      clientUpdatedAt: "2026-11-20T10:05:00.000Z",
      deleted: false,
      syncStatus: "synced",
    };

    await saveNote(note1);
    await saveNote(note2);

    let list = await listNotes();
    expect(list.length).toBe(2);

    // Soft delete note1
    await deleteNote("note-1", true);

    list = await listNotes(false);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("note-2");

    const allWithDeleted = await listNotes(true);
    expect(allWithDeleted.length).toBe(2);
    const deletedItem = allWithDeleted.find((n) => n.id === "note-1");
    expect(deletedItem?.deleted).toBe(true);
    expect(deletedItem?.syncStatus).toBe("pending");
  });

  it("hard deletes a note completely from store", async () => {
    const note: LocalEncryptedNote = {
      id: "note-to-hard-delete",
      encryptedEnvelope: "env-hd",
      version: 1,
      clientUpdatedAt: new Date().toISOString(),
      deleted: false,
      syncStatus: "synced",
    };

    await saveNote(note);
    await deleteNote("note-to-hard-delete", false);

    const retrieved = await getNote("note-to-hard-delete");
    expect(retrieved).toBeUndefined();
  });

  it("executes batch transactions atomically", async () => {
    const batch: LocalEncryptedNote[] = [
      {
        id: "batch-1",
        encryptedEnvelope: "env-b1",
        version: 1,
        clientUpdatedAt: "2026-11-20T11:00:00.000Z",
        deleted: false,
        syncStatus: "synced",
      },
      {
        id: "batch-2",
        encryptedEnvelope: "env-b2",
        version: 1,
        clientUpdatedAt: "2026-11-20T11:01:00.000Z",
        deleted: false,
        syncStatus: "synced",
      },
    ];

    await saveNotesBatch(batch);

    const n1 = await getNote("batch-1");
    const n2 = await getNote("batch-2");
    expect(n1?.encryptedEnvelope).toBe("env-b1");
    expect(n2?.encryptedEnvelope).toBe("env-b2");
  });
});
