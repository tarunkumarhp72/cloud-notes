import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormatButtons } from "./FormatButtons";

describe("FormatButtons Component", () => {
  it("renders Bold, Italic, Underline, Strikethrough, Clear formatting buttons", () => {
    render(<FormatButtons isBold={true} isItalic={false} isUnderline={true} isStrikethrough={false} />);

    const boldBtn = screen.getByRole("button", { name: /bold/i });
    const italicBtn = screen.getByRole("button", { name: /italic/i });
    const underlineBtn = screen.getByRole("button", { name: /underline/i });
    const strikeBtn = screen.getByRole("button", { name: /strikethrough/i });
    const clearBtn = screen.getByRole("button", { name: /clear formatting/i });

    expect(boldBtn).toBeDefined();
    expect(italicBtn).toBeDefined();
    expect(underlineBtn).toBeDefined();
    expect(strikeBtn).toBeDefined();
    expect(clearBtn).toBeDefined();

    expect(boldBtn.getAttribute("aria-pressed")).toBe("true");
    expect(italicBtn.getAttribute("aria-pressed")).toBe("false");
    expect(underlineBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("triggers callbacks when clicked", () => {
    const handleBold = vi.fn();
    const handleItalic = vi.fn();
    const handleUnderline = vi.fn();
    const handleStrike = vi.fn();
    const handleClear = vi.fn();

    render(
      <FormatButtons
        onToggleBold={handleBold}
        onToggleItalic={handleItalic}
        onToggleUnderline={handleUnderline}
        onToggleStrikethrough={handleStrike}
        onClearFormatting={handleClear}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /bold/i }));
    expect(handleBold).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /italic/i }));
    expect(handleItalic).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /underline/i }));
    expect(handleUnderline).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /strikethrough/i }));
    expect(handleStrike).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /clear formatting/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
