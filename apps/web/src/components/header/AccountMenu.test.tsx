import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AccountMenu, UserProfile } from "./AccountMenu";

describe("AccountMenu Component", () => {
  const mockUser: UserProfile = {
    id: "user-123",
    displayName: "Tarun Kumar",
    email: "tarunkumar@csdevhub.com",
    avatarUrl: null,
  };

  it("renders sign in button when user is null and triggers onSignInClick", async () => {
    const handleSignIn = vi.fn();
    render(<AccountMenu user={null} onSignInClick={handleSignIn} />);
    const btn = screen.getByLabelText("Sign in");
    expect(btn).toBeDefined();

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it("renders user initial when user is logged in", () => {
    render(<AccountMenu user={mockUser} />);
    const btn = screen.getByLabelText("Account: Tarun Kumar");
    expect(btn).toBeDefined();
    expect(screen.getByText("T")).toBeDefined();
  });

  it("opens flyout with name, email and sign out button upon click", async () => {
    const handleSignOut = vi.fn();
    render(<AccountMenu user={mockUser} onSignOut={handleSignOut} />);

    const btn = screen.getByLabelText("Account: Tarun Kumar");
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(screen.getByRole("dialog", { name: /account details/i })).toBeDefined();
    expect(screen.getByText("Tarun Kumar")).toBeDefined();
    expect(screen.getByText("tarunkumar@csdevhub.com")).toBeDefined();

    const signOutBtn = screen.getByLabelText("Sign out");
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(handleSignOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: /account details/i })).toBeNull();
  });

  it("closes flyout when clicking outside", async () => {
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <AccountMenu user={mockUser} />
      </div>
    );

    const btn = screen.getByLabelText("Account: Tarun Kumar");
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByRole("dialog")).toBeDefined();

    await act(async () => {
      fireEvent.mouseDown(screen.getByTestId("outside"));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
