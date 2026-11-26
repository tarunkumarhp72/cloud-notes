import { config } from "../config.js";

export interface GoogleDriveFile {
  id: string;
  name: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  expiresIn: number;
}

export class GoogleDriveClient {
  private fetchFn: typeof fetch;

  constructor(customFetch?: typeof fetch) {
    this.fetchFn = customFetch || fetch;
  }

  /**
   * Refreshes a Google OAuth access token using a stored refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult> {
    const clientId = config.google.clientId;
    const clientSecret = config.google.clientSecret;

    const response = await this.fetchFn("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google token refresh failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Finds an existing folder by name or creates it if it doesn't exist.
   */
  async findOrCreateFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const listRes = await this.fetchFn(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (listRes.ok) {
      const listData = (await listRes.json()) as { files?: { id: string; name: string }[] };
      if (listData.files && listData.files.length > 0) {
        return listData.files[0].id;
      }
    }

    // Create folder
    const createRes = await this.fetchFn("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create Google Drive folder '${folderName}': ${err}`);
    }

    const created = (await createRes.json()) as { id: string };
    return created.id;
  }

  /**
   * Ensures the standard directory structure: "Notes App Backups/<Subfolder>"
   */
  async ensureFolderHierarchy(
    accessToken: string,
    subfolder: "Daily" | "Weekly" | "Monthly" | "Manual"
  ): Promise<{ rootFolderId: string; subfolderId: string }> {
    const rootFolderId = await this.findOrCreateFolder(accessToken, "Notes App Backups");
    const subfolderId = await this.findOrCreateFolder(accessToken, subfolder, rootFolderId);
    return { rootFolderId, subfolderId };
  }

  /**
   * Uploads an encrypted backup binary (.enc.gz) using Google Drive multipart upload.
   */
  async uploadBackupFile(
    accessToken: string,
    folderId: string,
    fileName: string,
    content: Buffer
  ): Promise<GoogleDriveFile> {
    const boundary = `-------314159265358979323846_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: "application/octet-stream",
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: binary\r\n\r\n`
      ),
      content,
      Buffer.from(closeDelimiter),
    ]);

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime";
    const res = await this.fetchFn(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(multipartRequestBody.length),
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive upload failed (${res.status}): ${err}`);
    }

    const file = (await res.json()) as GoogleDriveFile;
    return file;
  }

  /**
   * Lists backup files inside a specific folder or all files under Notes App Backups.
   */
  async listFiles(accessToken: string, folderId?: string): Promise<GoogleDriveFile[]> {
    let query = "trashed = false";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=createdTime desc&fields=files(id,name,size,createdTime,modifiedTime)`;

    const res = await this.fetchFn(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive list files failed: ${err}`);
    }

    const data = (await res.json()) as { files: GoogleDriveFile[] };
    return data.files || [];
  }

  /**
   * Downloads binary content of a file from Google Drive.
   */
  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await this.fetchFn(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to download file from Google Drive: ${err}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  /**
   * Deletes a file from Google Drive.
   */
  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    await this.fetchFn(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  /**
   * Enforces retention policy by keeping only the N most recent backups in a folder.
   */
  async enforceRetention(accessToken: string, folderId: string, maxRetention = 3): Promise<number> {
    const files = await this.listFiles(accessToken, folderId);
    if (files.length <= maxRetention) return 0;

    const toDelete = files.slice(maxRetention);
    for (const f of toDelete) {
      try {
        await this.deleteFile(accessToken, f.id);
      } catch {
        // Continue cleaning up
      }
    }
    return toDelete.length;
  }
}

export const driveClient = new GoogleDriveClient();
