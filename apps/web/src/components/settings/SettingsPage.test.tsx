import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";
import { useSettingsStore } from "../../stores/settingsStore";

describe("SettingsPage Component", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "light",
      fontFamily: "Consolas",
      fontSize: 14,
      wordWrap: false,
      spellCheck: false,
      autoCorrect: false,
    });
  });

  it("renders Settings header and sections", () => {
    render(<SettingsPage onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeDefined();
    expect(screen.getByRole("button", { name: /back to editor/i })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "App theme" })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Font family" })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Font size" })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Word wrap switch" })).toBeDefined();
  });

  it("switches app theme to dark and applies data-theme attribute", () => {
    render(<SettingsPage onBack={vi.fn()} />);

    const themeSelect = screen.getByRole("combobox", { name: "App theme" });
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("updates font family and font size in settings store", () => {
    render(<SettingsPage onBack={vi.fn()} />);

    const fontSelect = screen.getByRole("combobox", { name: "Font family" });
    fireEvent.change(fontSelect, { target: { value: "Cascadia Code" } });
    expect(useSettingsStore.getState().fontFamily).toBe("Cascadia Code");

    const sizeSelect = screen.getByRole("combobox", { name: "Font size" });
    fireEvent.change(sizeSelect, { target: { value: "18" } });
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  it("toggles word wrap setting", () => {
    render(<SettingsPage onBack={vi.fn()} />);

    const wrapSwitch = screen.getByRole("checkbox", { name: "Word wrap switch" });
    fireEvent.click(wrapSwitch);

    expect(useSettingsStore.getState().wordWrap).toBe(true);
  });

  it("calls onBack when back button is clicked", () => {
    const handleBack = vi.fn();
    render(<SettingsPage onBack={handleBack} />);

    const backBtn = screen.getByRole("button", { name: /back to editor/i });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
