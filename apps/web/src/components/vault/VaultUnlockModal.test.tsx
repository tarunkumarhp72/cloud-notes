import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VaultUnlockModal } from "./VaultUnlockModal";

describe("VaultUnlockModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <VaultUnlockModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles initial vault passphrase setup with matching confirmation", async () => {
    const onSetup = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <VaultUnlockModal
        isOpen={true}
        isInitialSetup={true}
        onClose={onClose}
        onSuccess={onSuccess}
        customSetupHandler={onSetup}
      />
    );

    expect(screen.getByText("Protect your notes with encryption")).toBeDefined();

    const passInput = screen.getByPlaceholderText("Enter passphrase");
    const confirmInput = screen.getByPlaceholderText("Confirm passphrase");
    const submitBtn = screen.getByRole("button", { name: "Set passphrase" });

    // Too short (<6 chars)
    fireEvent.change(passInput, { target: { value: "123" } });
    fireEvent.click(submitBtn);
    expect(screen.getByText("Passphrase must be at least 6 characters")).toBeDefined();
    expect(onSetup).not.toHaveBeenCalled();

    // Mismatched confirmation
    fireEvent.change(passInput, { target: { value: "master-pass-123" } });
    fireEvent.change(confirmInput, { target: { value: "different-pass" } });
    fireEvent.click(submitBtn);
    expect(screen.getByText("Passphrases do not match")).toBeDefined();
    expect(onSetup).not.toHaveBeenCalled();

    // Valid match
    fireEvent.change(confirmInput, { target: { value: "master-pass-123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSetup).toHaveBeenCalledWith("master-pass-123");
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("handles unlocking vault and displays error on rejection", async () => {
    const onUnlock = vi.fn().mockRejectedValue(new Error("Incorrect passphrase. Please try again."));
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <VaultUnlockModal
        isOpen={true}
        isInitialSetup={false}
        onClose={onClose}
        onSuccess={onSuccess}
        customUnlockHandler={onUnlock}
      />
    );

    expect(screen.getByText("Unlock your encrypted notes")).toBeDefined();

    const passInput = screen.getByPlaceholderText("Enter passphrase");
    const submitBtn = screen.getByRole("button", { name: "Unlock" });

    fireEvent.change(passInput, { target: { value: "wrong-passphrase" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith("wrong-passphrase");
      expect(screen.getByText("Incorrect passphrase. Please try again.")).toBeDefined();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("triggers onForgotPassphrase when link is clicked", () => {
    const onForgot = vi.fn();
    render(
      <VaultUnlockModal
        isOpen={true}
        isInitialSetup={false}
        onClose={vi.fn()}
        onForgotPassphrase={onForgot}
      />
    );

    const forgotBtn = screen.getByRole("button", { name: "Forgot passphrase?" });
    fireEvent.click(forgotBtn);
    expect(onForgot).toHaveBeenCalledTimes(1);
  });
});
