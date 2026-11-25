import { describe, it, expect, beforeEach } from "vitest";
import { useRecentHistoryStore } from "./recentHistoryStore";

describe("recentHistoryStore", () => {
  beforeEach(() => {
    localStorage.removeItem("notepad_recent_history");
    useRecentHistoryStore.setState({ items: [] });
  });

  it("records closed and saved items and deduplicates by id", () => {
    const store = useRecentHistoryStore.getState();

    store.recordHistoryItem({
      id: "note-1",
      title: "Python Interview Notes",
      content: "Decorators and generators",
      isMarkdown: true,
      status: "closed",
    });

    expect(useRecentHistoryStore.getState().items.length).toBe(1);
    expect(useRecentHistoryStore.getState().items[0].status).toBe("closed");

    store.recordHistoryItem({
      id: "note-1",
      title: "Python Interview Notes",
      content: "Updated content",
      isMarkdown: true,
      status: "saved",
    });

    expect(useRecentHistoryStore.getState().items.length).toBe(1);
    expect(useRecentHistoryStore.getState().items[0].status).toBe("saved");
  });

  it("removes a single item or clears all history", () => {
    const store = useRecentHistoryStore.getState();
    store.recordHistoryItem({
      id: "note-1",
      title: "Note 1",
      content: "abc",
      isMarkdown: true,
      status: "closed",
    });
    store.recordHistoryItem({
      id: "note-2",
      title: "Note 2",
      content: "def",
      isMarkdown: false,
      status: "saved",
    });

    store.removeHistoryItem("note-1");
    expect(useRecentHistoryStore.getState().items.map((i) => i.id)).toEqual(["note-2"]);

    store.clearHistory();
    expect(useRecentHistoryStore.getState().items).toEqual([]);
  });
});
