# Google Drive OAuth & Cloud Console Setup Guide

This guide details the step-by-step setup required in Google Cloud Console to enable Google Drive Backup & Restore for Notepad Cloud.

---

## 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new project named `Notepad Cloud`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API**.
5. Click **Enable**.

---

## 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **User Type: External** and click **Create**.
3. Fill in:
   - **App name:** `Notepad Cloud`
   - **User support email:** Your email
   - **Developer contact information:** Your email
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Add or Remove Scopes**:
   - Add `https://www.googleapis.com/auth/drive.file` *(Permits the app to manage files it creates)*
   - Add `openid`, `email`, `profile`
6. Click **Update** and then **Save and Continue**.
7. If your app is in "Testing" mode, add your test Google account email under **Test users**.

---

## 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Application type:** `Web application`.
4. Name: `Notepad Cloud Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (Local frontend)
   - `https://your-domain.vercel.app` (Production frontend)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/auth/callback` (Auth sign-in callback)
   - `http://localhost:3000/auth/drive-callback` (Drive backup connection callback)
   - `https://your-domain.vercel.app/auth/callback` (Production sign-in)
   - `https://your-domain.vercel.app/auth/drive-callback` (Production drive callback)
7. Click **Create**.
8. Copy your **Client ID** and **Client Secret**.

---

## 4. Configure Environment Variables

Add the credentials to your environment files:

### Backend (`apps/api/.env` and `.env`)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Frontend (`apps/web/.env`)
```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 5. Security & Quota Notes
- **Free Quota:** The Google Drive REST API provides **20,000 requests per 100 seconds** for free, which is more than sufficient for user-scheduled backups.
- **Scope Advantage:** Using `drive.file` rather than full `drive` scope means our application does not require a formal security audit or CASA Tier 2 assessment by Google, making verification fast and straightforward.
