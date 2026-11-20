import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GoToDialog } from "./GoToDialog";

describe("GoToDialog Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <GoToDialog
        isOpen={false}
        onClose={vi.fn()}
        onGoTo={vi.fn()}
        currentLine={1}
        maxLine={10}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders with current line and submits valid line number", () => {
    const onGoTo = vi.fn();
    const onClose = vi.fn();

    render(
      <GoToDialog
        isOpen={true}
        onClose={onClose}
        onGoTo={onGoTo}
        currentLine={3}
        maxLine={25}
      />
    );

    expect(screen.getByText("Go to line")).toBeDefined();
    const input = screen.getByLabelText("Line number:") as HTMLInputElement;
    expect(input.value).toBe("3");

    fireEvent.change(input, { target: { value: "14" } });
    const submitBtn = screen.getByRole("button", { name: "Go to" });
    fireEvent.click(submitBtn);

    expect(onGoTo).toHaveBeenCalledWith(14);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error when line number exceeds maximum lines", () => {
    const onGoTo = vi.fn();

    render(
      <GoToDialog
        isOpen={true}
        onClose={vi.fn()}
        onGoTo={onGoTo}
        currentLine={1}
        maxLine={10}
      />
    );

    const input = screen.getByLabelText("Line number:");
    fireEvent.change(input, { target: { value: "99" } });
    const submitBtn = screen.getByRole("button", { name: "Go to" });
    fireEvent.click(submitBtn);

    expect(onGoTo).not.toHaveBeenCalled();
    expect(screen.getByText("The line number is beyond the total number of lines")).toBeDefined();
  });

  it("closes on Cancel button click or Escape key", () => {
    const onClose = vi.fn();

    render(
      <GoToDialog
        isOpen={true}
        onClose={onClose}
        onGoTo={vi.fn()}
        currentLine={1}
        maxLine={10}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
