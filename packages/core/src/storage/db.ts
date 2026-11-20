import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface NotepadDBSchema extends DBSchema {
  notes: {
    key: string;
    value: {
      id: string;
      encryptedEnvelope: string;
      version: number;
      clientUpdatedAt: string;
      deleted: boolean;
      syncStatus: "synced" | "pending" | "conflict";
    };
    indexes: { "by-updated": string; "by-sync": string };
  };
  vault: {
    key: string;
    value: {
      id: string;
      salt: string;
      authCheck: string;
      recoveryVerifier: string;
      createdAt: string;
    };
  };
  outbox: {
    key: string;
    value: {
      id: string;
      noteId: string;
      action: "upsert" | "delete";
      payload: string;
      attempts: number;
      createdAt: string;
    };
    indexes: { "by-created": string };
  };
}

const DB_NAME = "notepad_cloud_db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<NotepadDBSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<NotepadDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<NotepadDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" });
        notesStore.createIndex("by-updated", "clientUpdatedAt");
        notesStore.createIndex("by-sync", "syncStatus");
      }

      if (!db.objectStoreNames.contains("vault")) {
        db.createObjectStore("vault", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("outbox")) {
        const outboxStore = db.createObjectStore("outbox", { keyPath: "id" });
        outboxStore.createIndex("by-created", "createdAt");
      }
    },
  });

  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
