import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinkModal, LinkButton } from "./LinkModal";

describe("LinkModal Component", () => {
  it("renders modal with placeholders matching image copy 7.png", () => {
    render(<LinkModal isOpen={true} onInsert={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Link")).toBeDefined();

    const textInput = screen.getByPlaceholderText("Text for the link (optional)");
    const addressInput = screen.getByPlaceholderText("Link to an existing webpage");

    expect(textInput).toBeDefined();
    expect(addressInput).toBeDefined();

    expect(screen.getByRole("button", { name: "Insert" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  it("submits link data on Insert click", () => {
    const handleInsert = vi.fn();
    const handleClose = vi.fn();

    render(
      <LinkModal
        isOpen={true}
        initialText="My Site"
        initialUrl="https://example.com"
        onInsert={handleInsert}
        onClose={handleClose}
      />
    );

    const insertBtn = screen.getByRole("button", { name: "Insert" });
    fireEvent.click(insertBtn);

    expect(handleInsert).toHaveBeenCalledWith("My Site", "https://example.com");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", () => {
    const handleClose = vi.fn();

    render(<LinkModal isOpen={true} onInsert={vi.fn()} onClose={handleClose} />);

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders LinkButton in toolbar", () => {
    const handleClick = vi.fn();
    render(<LinkButton onClick={handleClick} />);

    const btn = screen.getByRole("button", { name: /link/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
