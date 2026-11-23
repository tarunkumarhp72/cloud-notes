import { getDb, type NotepadDBSchema } from "./db";

export type VaultRecord = NotepadDBSchema["vault"]["value"];

export const PRIMARY_VAULT_ID = "primary-vault";
export const VAULT_AUTH_CHECK_TOKEN = "notepad-cloud-vault-verified";

export async function saveVaultMetadata(vault: VaultRecord): Promise<void> {
  const db = await getDb();
  await db.put("vault", vault);
}

export async function getVaultMetadata(id = PRIMARY_VAULT_ID): Promise<VaultRecord | undefined> {
  const db = await getDb();
  return db.get("vault", id);
}

export async function clearVaultMetadata(id = PRIMARY_VAULT_ID): Promise<void> {
  const db = await getDb();
  await db.delete("vault", id);
}
