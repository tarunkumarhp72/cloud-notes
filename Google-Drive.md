# Task: Implement Automatic Google Drive Backup & Restore in Existing Notes Project

## 1. Project Context

We already have an existing Notes application with its own frontend, backend, database, and existing functionality.

Your task is to add a new feature: **Automatic Google Drive Backup & Restore**, similar to WhatsApp's Google Drive Chat Backup functionality.

**Important instructions:**
- This is an existing Notes project, not a new project.
- Do not create a separate application.
- Do not assume any technology stack, folder structure, database schema, or architecture.
- First inspect the complete existing project and understand how it works.
- Reuse the existing architecture, authentication, database models, APIs, coding conventions, and UI components.
- Do not remove, rewrite, or break existing functionality.
- Keep changes limited to the Google Drive backup feature.

## 2. Expected User Experience

Users should be able to connect their personal Google Drive account to the Notes application.

After connecting, users can configure automatic backup frequency:

1. Daily
2. Weekly
3. Monthly
4. Disable automatic backup

The application should automatically back up the user's notes to their connected Google Drive according to the selected schedule.

Users should also have the option to:
- Trigger a manual backup.
- View their last successful backup date and time.
- View their next scheduled backup.
- View backup history.
- Restore notes from an existing backup.
- Disconnect their Google Drive account.
- Enable or disable automatic backup whenever required.

## 3. Google OAuth Integration

Use Google OAuth 2.0 to allow users to connect their own Google accounts.

Requirements:

- Use Google Cloud OAuth credentials.
- Implement a secure OAuth authorization flow.
- Request the minimum required Google Drive permissions.
- Prefer the `drive.file` scope where compatible with the backup and restore implementation.
- Store OAuth access tokens and refresh tokens securely using encryption.
- Never expose Google Client Secret or refresh tokens to the frontend.
- Implement automatic access-token refresh.
- Handle expired, revoked, and invalid credentials.
- Handle OAuth cancellation and failed authorization.
- Allow users to disconnect their Google account.

Read credentials from environment variables:

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

Never hardcode credentials.

Do not commit real credentials to Git.

## 4. Backup Functionality

Create a dedicated folder in the connected user's Google Drive:

Google Drive/
└── Notes App Backups/
    ├── Daily/
    ├── Weekly/
    └── Monthly/

Backup requirements:

- Back up only data belonging to the authenticated user.
- Preserve note IDs, content, creation timestamps, modification timestamps, and relevant metadata.
- Use a structured JSON backup format unless the existing application has a better established export format.
- Include a backup version and creation timestamp.
- Ensure backups are complete and valid before marking them successful.
- Avoid unnecessary duplicate uploads.
- Do not overwrite a newer backup accidentally.
- Handle large note collections efficiently.
- Support future backup format migrations.

Implement incremental backup where practical, so unchanged notes do not need to be repeatedly uploaded.

## 5. Automatic Scheduling

Implement background scheduling using the existing infrastructure.

If the project already has a scheduler or worker, reuse it.

Otherwise, evaluate a suitable solution compatible with the existing deployment.

Requirements:

- Daily backup.
- Weekly backup.
- Monthly backup.
- Per-user scheduling.
- Respect the user's configured timezone.
- Calculate the next backup correctly.
- Prevent duplicate backup execution.
- Handle temporary Google API failures.
- Implement retry logic with reasonable limits.
- Record failed backup attempts.
- Never block normal Notes application operations while a backup is running.

Important: Scheduled backups must continue to work independently of whether the user keeps the browser open.

## 6. Restore Functionality

Users must be able to restore their notes from Google Drive backups.

Requirements:

- Retrieve available backups.
- Display backup date and time.
- Display backup type.
- Display note count where available.
- Allow users to select a backup.
- Validate the backup before restoration.
- Preserve original note IDs wherever possible.
- Prevent accidental duplicate notes.
- Handle conflicts with existing notes safely.
- Provide confirmation before restoration.
- Never silently overwrite newer user data.

Implement an appropriate restore strategy based on the existing database and note ownership model.

## 7. Database Changes

First inspect the existing database schema.

Reuse existing tables wherever appropriate.

Only introduce new tables or fields when required.

Potential entities:

### Google Drive Connection
- User ID
- Google account email
- Encrypted access token
- Encrypted refresh token
- Connection status
- Connected timestamp

### Backup Settings
- User ID
- Backup frequency
- Automatic backup enabled/disabled
- Timezone
- Last backup timestamp
- Next backup timestamp

### Backup History
- User ID
- Google Drive file ID
- Backup type
- Backup status
- Notes count
- File size
- Created timestamp
- Error details

Add appropriate indexes, foreign keys, and uniqueness constraints.

Follow existing migration conventions.

## 8. Frontend Implementation

Add a new Google Drive Backup section to the existing application.

Do not redesign the entire application.

Follow the existing UI design system, typography, spacing, colors, and component conventions.

### When Google Drive is not connected

Display:
- Google Drive connection status.
- Connect Google Drive button.
- Short explanation of automatic backups.

### When Google Drive is connected

Display:
- Connected Google account.
- Connection status.
- Automatic backup toggle.
- Backup frequency selection.
- Last successful backup.
- Next scheduled backup.
- Backup Now button.
- Backup History.
- Restore functionality.
- Disconnect Google Drive option.

Provide loading states, success messages, error messages, and confirmation dialogs.

Ensure responsive design.

## 9. Security Requirements

This functionality handles users' personal notes, so security is essential.

- Enforce authentication on all backup APIs.
- Enforce user-level authorization.
- Never allow one user to access another user's backups.
- Encrypt OAuth tokens at rest.
- Keep client secrets exclusively on the backend.
- Validate all uploaded and downloaded backup data.
- Protect against malicious backup files.
- Implement appropriate CSRF protection for OAuth.
- Do not log sensitive tokens or note contents.
- Handle Google OAuth revocation safely.

## 10. Implementation Workflow — Mandatory

Do not immediately start modifying files.

### Phase 1: Existing Project Audit

Inspect:

- Frontend architecture.
- Backend architecture.
- Authentication and authorization.
- Existing notes database models.
- Note creation, editing, deletion, and retrieval flows.
- Existing background jobs or scheduler.
- Environment configuration.
- Deployment configuration.
- Existing UI design system.

Prepare an audit report identifying the exact files and components that will need changes.

### Phase 2: Implementation Plan

Create:

`GOOGLE_DRIVE_BACKUP_PLAN.md`

Include:

- Existing architecture summary.
- Proposed architecture.
- Database changes.
- New backend modules.
- New API endpoints.
- Frontend changes.
- OAuth flow.
- Scheduler implementation.
- Backup and restore flow.
- Security considerations.
- Testing strategy.
- Deployment requirements.

Do not make architectural changes without a clear reason.

### Phase 3: Incremental Development

Break implementation into small tasks.

For every task:

1. Explain what will change.
2. Identify the files involved.
3. Implement only that task.
4. Run relevant tests.
5. Check for regressions.
6. Update the implementation checklist.
7. Proceed only after successful verification.

If a test fails, stop and investigate the failure. Do not continue to the next task while an unresolved failure remains.

### Phase 4: Testing

Test the following scenarios:

1. Connect a Google account successfully.
2. Cancel Google OAuth authorization.
3. Disconnect Google Drive.
4. Reconnect Google Drive.
5. Perform a manual backup.
6. Verify the backup file in Google Drive.
7. Perform a daily scheduled backup.
8. Perform a weekly scheduled backup.
9. Perform a monthly scheduled backup.
10. Verify automatic token refresh.
11. Handle revoked Google permissions.
12. Handle Google API failures.
13. Restore an existing backup.
14. Restore when notes already exist.
15. Verify no duplicate notes are created.
16. Verify one user's data cannot be accessed by another user.
17. Verify existing Notes functionality remains unaffected.

## 11. Deployment and Google Cloud Configuration

Prepare a separate deployment document:

`GOOGLE_DRIVE_SETUP.md`

Explain:

- How to enable Google Drive API.
- How to configure Google OAuth.
- How to create OAuth Client ID and Client Secret.
- How to configure authorized origins and redirect URIs.
- How to configure OAuth consent and verification requirements.
- Which environment variables need to be configured.
- How to configure production and local development environments.

Do not assume Google Cloud credentials already exist.

The implementation must work with credentials supplied later through environment variables.

Prefer Google Drive API usage that does not require a paid Google Cloud service.

Clearly document any Google verification, quota, or deployment limitations.

## 12. Final Deliverables

At completion, provide:

1. Project audit report.
2. `GOOGLE_DRIVE_BACKUP_PLAN.md`.
3. Fully implemented Google OAuth integration.
4. Backup and restore backend functionality.
5. Automatic daily, weekly, and monthly scheduler.
6. Frontend Google Drive Backup settings.
7. Database migrations.
8. Automated tests.
9. `GOOGLE_DRIVE_SETUP.md`.
10. Final implementation and testing report.

## Final Instructions

- Preserve all existing Notes application functionality.
- Do not introduce unnecessary dependencies.
- Do not create duplicate authentication systems.
- Do not hardcode credentials.
- Do not use mock implementations as production functionality.
- Do not claim a feature is completed without testing it.
- Follow the existing project's conventions.
- Prioritize data integrity, security, and reliability.

**First complete Phase 1 and Phase 2. Present the audit and implementation plan before starting development.**