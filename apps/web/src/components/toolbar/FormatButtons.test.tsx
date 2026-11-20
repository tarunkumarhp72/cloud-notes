import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormatButtons } from "./FormatButtons";

describe("FormatButtons Component", () => {
  it("renders Bold, Italic, Strikethrough, Clear formatting buttons", () => {
    render(<FormatButtons isBold={true} isItalic={false} isStrikethrough={false} />);

    const boldBtn = screen.getByRole("button", { name: /bold/i });
    const italicBtn = screen.getByRole("button", { name: /italic/i });
    const strikeBtn = screen.getByRole("button", { name: /strikethrough/i });
    const clearBtn = screen.getByRole("button", { name: /clear formatting/i });

    expect(boldBtn).toBeDefined();
    expect(italicBtn).toBeDefined();
    expect(strikeBtn).toBeDefined();
    expect(clearBtn).toBeDefined();

    expect(boldBtn.getAttribute("aria-pressed")).toBe("true");
    expect(italicBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("triggers callbacks when clicked", () => {
    const handleBold = vi.fn();
    const handleItalic = vi.fn();
    const handleStrike = vi.fn();
    const handleClear = vi.fn();

    render(
      <FormatButtons
        onToggleBold={handleBold}
        onToggleItalic={handleItalic}
        onToggleStrikethrough={handleStrike}
        onClearFormatting={handleClear}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /bold/i }));
    expect(handleBold).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /italic/i }));
    expect(handleItalic).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /strikethrough/i }));
    expect(handleStrike).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /clear formatting/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
