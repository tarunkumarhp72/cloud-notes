import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteLimitModal } from "./NoteLimitModal";

describe("NoteLimitModal Component", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <NoteLimitModal
        isOpen={false}
        isGuest={true}
        limit={10}
        currentCount={10}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders guest limit message and Sign in button when isGuest is true", () => {
    const onSignIn = vi.fn();
    const onClose = vi.fn();

    render(
      <NoteLimitModal
        isOpen={true}
        isGuest={true}
        limit={10}
        currentCount={10}
        onClose={onClose}
        onSignIn={onSignIn}
      />
    );

    expect(screen.getByText("Guest Note Limit Reached")).toBeDefined();
    expect(screen.getByText("10 / 10 Notes")).toBeDefined();
    expect(screen.getByText(/Guest mode allows up to 10 notes/i)).toBeDefined();

    const signInBtn = screen.getByRole("button", { name: /Sign in with Google/i });
    fireEvent.click(signInBtn);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders logged in user limit message when isGuest is false", () => {
    const onClose = vi.fn();

    render(
      <NoteLimitModal
        isOpen={true}
        isGuest={false}
        limit={50}
        currentCount={50}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Maximum Note Limit Reached")).toBeDefined();
    expect(screen.getByText("50 / 50 Notes")).toBeDefined();
    expect(screen.getByText(/maximum limit of 50 active notes/i)).toBeDefined();
    expect(screen.queryByText(/Sign in with Google/i)).toBeNull();

    const gotItBtn = screen.getByRole("button", { name: /Got it/i });
    fireEvent.click(gotItBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
