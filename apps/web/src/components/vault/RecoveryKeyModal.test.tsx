import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecoveryKeyModal } from "./RecoveryKeyModal";

describe("RecoveryKeyModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <RecoveryKeyModal isOpen={false} mode="display" onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  describe("Display Mode (Vault setup)", () => {
    const dummyKey = "A1B2-C3D4-E5F6-7890-1122-3344-5566-7788-99AA-BBCC-DDEE-FF00-1234-5678-9ABC-DEF0";

    it("displays the generated recovery key and warns the user", () => {
      render(
        <RecoveryKeyModal
          isOpen={true}
          mode="display"
          recoveryKey={dummyKey}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText("Emergency Recovery Key")).toBeDefined();
      expect(screen.getByTestId("recovery-code").textContent).toBe(dummyKey);
      expect(screen.getByText(/Keep this key secure!/)).toBeDefined();
    });

    it("requires confirmation checkbox before allowing completion", () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      render(
        <RecoveryKeyModal
          isOpen={true}
          mode="display"
          recoveryKey={dummyKey}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const doneBtn = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
      expect(doneBtn.disabled).toBe(true);

      const checkbox = screen.getByTestId("recovery-confirm-checkbox");
      fireEvent.click(checkbox);
      expect(doneBtn.disabled).toBe(false);

      fireEvent.click(doneBtn);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("copies the recovery key to the clipboard", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <RecoveryKeyModal
          isOpen={true}
          mode="display"
          recoveryKey={dummyKey}
          onClose={vi.fn()}
        />
      );

      const copyBtn = screen.getByRole("button", { name: "Copy recovery key" });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(dummyKey);
        expect(screen.getByText("✓ Copied")).toBeDefined();
      });
    });
  });

  describe("Recover Mode (Forgot passphrase)", () => {
    it("renders recover form and handles successful restoration", async () => {
      const onRecover = vi.fn().mockResolvedValue(true);
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <RecoveryKeyModal
          isOpen={true}
          mode="recover"
          onClose={onClose}
          onSuccess={onSuccess}
          customRecoverHandler={onRecover}
        />
      );

      expect(screen.getByText("Recover Your Vault")).toBeDefined();

      const input = screen.getByPlaceholderText(/Paste your 64-character recovery key/);
      const submitBtn = screen.getByRole("button", { name: "Restore Access" });

      fireEvent.change(input, {
        target: { value: "A1B2-C3D4-E5F6-7890-1122-3344-5566-7788-99AA-BBCC-DDEE-FF00-1234-5678-9ABC-DEF0" },
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onRecover).toHaveBeenCalledWith(
          "A1B2-C3D4-E5F6-7890-1122-3344-5566-7788-99AA-BBCC-DDEE-FF00-1234-5678-9ABC-DEF0"
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("displays error banner when recovery fails", async () => {
      const onRecover = vi.fn().mockRejectedValue(new Error("Invalid recovery key. Unable to recover vault."));

      render(
        <RecoveryKeyModal
          isOpen={true}
          mode="recover"
          onClose={vi.fn()}
          customRecoverHandler={onRecover}
        />
      );

      const input = screen.getByPlaceholderText(/Paste your 64-character recovery key/);
      const submitBtn = screen.getByRole("button", { name: "Restore Access" });

      fireEvent.change(input, { target: { value: "invalid-key" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Invalid recovery key. Unable to recover vault.")).toBeDefined();
      });
    });
  });
});
