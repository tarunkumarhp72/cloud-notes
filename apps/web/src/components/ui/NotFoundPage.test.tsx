import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders 404 message and Back to Notes button", () => {
    const onGoHome = vi.fn();

    render(<NotFoundPage onGoHome={onGoHome} />);

    expect(screen.getByText("404 • NOT FOUND")).toBeDefined();
    expect(screen.getByText("This page is not found")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Back to Notes" }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
