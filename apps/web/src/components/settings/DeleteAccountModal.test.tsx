import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteAccountModal } from "./DeleteAccountModal";

// Mock @notepad/core
vi.mock("@notepad/core", () => ({
  clearAllLocalData: vi.fn().mockResolvedValue(undefined),
}));

describe("T-045 DeleteAccountModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open and displays title and warning", () => {
    render(<DeleteAccountModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Delete Account & Purge Data")).toBeDefined();
    expect(
      screen.getByText(/permanently wipe all end-to-end encrypted notes/i)
    ).toBeDefined();
  });

  it("keeps delete button disabled until DELETE is typed", () => {
    render(<DeleteAccountModal isOpen={true} onClose={() => {}} />);
    const deleteBtn = screen.getByRole("button", {
      name: /permanently delete account/i,
    });
    expect(deleteBtn.hasAttribute("disabled")).toBe(true);

    const input = screen.getByLabelText(/confirm delete by typing DELETE/i);
    fireEvent.change(input, { target: { value: "DEL" } });
    expect(deleteBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(deleteBtn.hasAttribute("disabled")).toBe(false);
  });

  it("calls delete and clears local data when confirmed", async () => {
    const handleClose = vi.fn();
    const handleDeleted = vi.fn();

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={handleClose}
        onDeleted={handleDeleted}
      />
    );

    const input = screen.getByLabelText(/confirm delete by typing DELETE/i);
    fireEvent.change(input, { target: { value: "DELETE" } });

    const deleteBtn = screen.getByRole("button", {
      name: /permanently delete account/i,
    });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(handleDeleted).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
