import { describe, it, expect, beforeEach } from "vitest";
import {
  useRecycleBinStore,
  isExpiredRecycleItem,
  getDaysRemaining,
  RECYCLE_BIN_RETENTION_DAYS,
} from "./recycleBinStore";

describe("recycleBinStore (15-day retention)", () => {
  beforeEach(() => {
    localStorage.removeItem("notepad_recycle_bin");
    useRecycleBinStore.setState({ items: [] });
  });

  it("moves deleted notes to Recycle Bin and restores them", () => {
    const store = useRecycleBinStore.getState();
    store.moveToRecycleBin({
      id: "note-1",
      title: "Deleted Note",
      content: "Important text",
      isMarkdown: true,
      isCustomTitle: true,
    });

    expect(useRecycleBinStore.getState().items.length).toBe(1);
    const restored = useRecycleBinStore.getState().restoreFromRecycleBin("note-1");
    expect(restored?.title).toBe("Deleted Note");
    expect(useRecycleBinStore.getState().items.length).toBe(0);
  });

  it("automatically purges items older than 15 days", () => {
    const sixteenDaysAgo = new Date(
      Date.now() - (RECYCLE_BIN_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
    ).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    expect(isExpiredRecycleItem(sixteenDaysAgo)).toBe(true);
    expect(isExpiredRecycleItem(twoDaysAgo)).toBe(false);
    expect(getDaysRemaining(twoDaysAgo)).toBe(13);

    useRecycleBinStore.setState({
      items: [
        {
          id: "old-1",
          title: "Expired",
          content: "old",
          isMarkdown: false,
          isCustomTitle: false,
          deletedAt: sixteenDaysAgo,
        },
        {
          id: "fresh-1",
          title: "Still Valid",
          content: "fresh",
          isMarkdown: true,
          isCustomTitle: true,
          deletedAt: twoDaysAgo,
        },
      ],
    });

    useRecycleBinStore.getState().purgeExpired();
    const remaining = useRecycleBinStore.getState().items;
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe("fresh-1");
  });
});
