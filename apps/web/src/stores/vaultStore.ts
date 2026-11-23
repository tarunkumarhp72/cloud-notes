import { create } from "zustand";
import {
  deriveKeyFromPassphrase,
  importAesKey,
  encryptAesGcm,
  decryptAesGcm,
  getVaultMetadata,
  saveVaultMetadata,
  PRIMARY_VAULT_ID,
  VAULT_AUTH_CHECK_TOKEN,
  type EncryptedData,
} from "@notepad/core";

export interface VaultState {
  isInitialized: boolean;
  isLocked: boolean;
  vaultKey: CryptoKey | null;
  salt: string | null;
  error: string | null;
  checkVaultStatus: () => Promise<boolean>;
  setupVault: (passphrase: string) => Promise<CryptoKey>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  setError: (err: string | null) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  isInitialized: false,
  isLocked: true,
  vaultKey: null,
  salt: null,
  error: null,

  setError: (error) => set({ error }),

  checkVaultStatus: async () => {
    try {
      const record = await getVaultMetadata(PRIMARY_VAULT_ID);
      if (record) {
        set({ isInitialized: true, salt: record.salt });
        return true;
      } else {
        set({ isInitialized: false, salt: null });
        return false;
      }
    } catch (err) {
      console.error("Failed to check vault status:", err);
      return false;
    }
  },

  setupVault: async (passphrase: string) => {
    if (!passphrase || passphrase.length < 6) {
      const msg = "Passphrase must be at least 6 characters";
      set({ error: msg });
      throw new Error(msg);
    }

    try {
      const derived = await deriveKeyFromPassphrase(passphrase);
      const cryptoKey = await importAesKey(derived.rawKey);
      const authCheckData: EncryptedData = await encryptAesGcm(
        cryptoKey,
        VAULT_AUTH_CHECK_TOKEN
      );

      await saveVaultMetadata({
        id: PRIMARY_VAULT_ID,
        salt: derived.salt,
        authCheck: JSON.stringify(authCheckData),
        recoveryVerifier: "",
        createdAt: new Date().toISOString(),
      });

      set({
        isInitialized: true,
        isLocked: false,
        vaultKey: cryptoKey,
        salt: derived.salt,
        error: null,
      });

      return cryptoKey;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to setup vault";
      set({ error: msg });
      throw err;
    }
  },

  unlockVault: async (passphrase: string) => {
    try {
      const record = await getVaultMetadata(PRIMARY_VAULT_ID);
      if (!record) {
        throw new Error("Vault has not been initialized");
      }

      const derived = await deriveKeyFromPassphrase(passphrase, record.salt);
      const cryptoKey = await importAesKey(derived.rawKey);

      let authCheckData: EncryptedData;
      try {
        authCheckData = JSON.parse(record.authCheck);
      } catch {
        throw new Error("Corrupted vault authentication record");
      }

      const decrypted = await decryptAesGcm(cryptoKey, authCheckData);
      if (decrypted !== VAULT_AUTH_CHECK_TOKEN) {
        throw new Error("Incorrect passphrase. Please try again.");
      }

      set({
        vaultKey: cryptoKey,
        isLocked: false,
        error: null,
      });

      return true;
    } catch {
      const msg = "Incorrect passphrase. Please try again.";
      set({ error: msg });
      throw new Error(msg);
    }
  },

  lockVault: () => {
    set({
      vaultKey: null,
      isLocked: true,
    });
  },
}));
