import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SignInModal } from "./SignInModal";

describe("SignInModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(<SignInModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title, description and sign in button when isOpen is true", () => {
    render(<SignInModal isOpen={true} />);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Sign in to Notepad")).toBeDefined();
    expect(screen.getByText(/sync your end-to-end encrypted notes/i)).toBeDefined();
    expect(screen.getByLabelText("Sign in with Google")).toBeDefined();
  });

  it("displays error banner when error prop is provided", () => {
    render(<SignInModal isOpen={true} error="OAuth login failed. Please try again." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("OAuth login failed. Please try again.")).toBeDefined();
  });

  it("triggers onGoogleSignIn when Google button is clicked", async () => {
    const handleSignIn = vi.fn().mockResolvedValue(undefined);
    render(<SignInModal isOpen={true} onGoogleSignIn={handleSignIn} />);
    const btn = screen.getByLabelText("Sign in with Google");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it("triggers onClose when skip button is clicked", async () => {
    const handleClose = vi.fn();
    render(<SignInModal isOpen={true} onClose={handleClose} />);
    const skipBtn = screen.getByText(/continue offline without signing in/i);
    await act(async () => {
      fireEvent.click(skipBtn);
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
