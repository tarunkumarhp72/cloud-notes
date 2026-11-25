import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotFoundPage, ProtectedRoutePage } from "./NotFoundPage";

describe("NotFoundPage & ProtectedRoutePage", () => {
  it("renders 404 page with path and triggers navigation callbacks", () => {
    const onGoHome = vi.fn();
    const onGoHistory = vi.fn();

    render(
      <NotFoundPage
        path="/unknown-route"
        onGoHome={onGoHome}
        onGoHistory={onGoHistory}
      />
    );

    expect(screen.getByText("404 • NOT FOUND")).toBeDefined();
    expect(screen.getByText("Page not found")).toBeDefined();
    expect(screen.getByText("/unknown-route")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Back to Editor" }));
    expect(onGoHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Recent Notes" }));
    expect(onGoHistory).toHaveBeenCalledTimes(1);
  });

  it("renders ProtectedRoutePage and triggers sign in or back", () => {
    const onSignIn = vi.fn();
    const onBack = vi.fn();

    render(
      <ProtectedRoutePage
        routeName="Recycle Bin"
        onSignIn={onSignIn}
        onBack={onBack}
      />
    );

    expect(screen.getByText("PROTECTED ROUTE")).toBeDefined();
    expect(screen.getByText("Sign in required")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Back to Editor" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
