import { describe, it, expect } from "vitest";
import { detectNoteConflict, type NoteVersionInfo } from "./conflicts";

describe("Sync Conflict Resolution (T-035)", () => {
  const baseLocal: NoteVersionInfo = {
    id: "note-uuid-1",
    title: "Project Architecture",
    content: "Local draft edits: adding section on zero-knowledge encryption.",
    isMarkdown: true,
    version: 1,
    updatedAt: "2026-11-23T12:00:00.000Z",
  };

  const baseRemote: NoteVersionInfo = {
    id: "note-uuid-1",
    title: "Project Architecture",
    content: "Remote concurrent edits: adding section on Supabase pooler.",
    isMarkdown: true,
    version: 2,
    updatedAt: "2026-11-23T12:05:00.000Z",
  };

  it("applies remote updates cleanly when local has no dirty edits", () => {
    const result = detectNoteConflict(baseLocal, baseRemote, false);
    expect(result.hasConflict).toBe(false);
    expect(result.winner).toEqual(baseRemote);
    expect(result.loser).toBeNull();
    expect(result.conflictTabTitle).toBeNull();
  });

  it("detects no conflict when contents and titles match identically", () => {
    const matchingRemote = { ...baseLocal, version: 2 };
    const result = detectNoteConflict(baseLocal, matchingRemote, true);
    expect(result.hasConflict).toBe(false);
    expect(result.winner).toEqual(matchingRemote);
    expect(result.loser).toBeNull();
  });

  it("detects divergence and designates newer remote as winner and local as conflict note", () => {
    // Remote is newer (12:05 vs 12:00)
    const result = detectNoteConflict(baseLocal, baseRemote, true);

    expect(result.hasConflict).toBe(true);
    expect(result.winner).toEqual(baseRemote);
    expect(result.loser).toEqual(baseLocal);
    expect(result.conflictTabTitle).toBe("Project Architecture - conflict");
  });

  it("detects divergence and designates newer local as winner and remote as conflict note", () => {
    const newerLocal = {
      ...baseLocal,
      updatedAt: "2026-11-23T12:10:00.000Z",
    };

    const result = detectNoteConflict(newerLocal, baseRemote, true);

    expect(result.hasConflict).toBe(true);
    expect(result.winner).toEqual(newerLocal);
    expect(result.loser).toEqual(baseRemote);
    expect(result.conflictTabTitle).toBe("Project Architecture - conflict");
  });

  it("handles fallback to 'Untitled - conflict' when note has empty title", () => {
    const untitledLocal = { ...baseLocal, title: "" };
    const untitledRemote = { ...baseRemote, title: "" };

    const result = detectNoteConflict(untitledLocal, untitledRemote, true);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictTabTitle).toBe("Untitled - conflict");
  });
});
