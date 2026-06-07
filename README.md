# AUTY Decorating Workspace

AUTY Decorating Workspace is a browser-based React workspace for a sole trader or small decorating business. It supports client records, room-by-room quotations, invoices, calendar entries, photo attachments, JSON backups, and Supabase-backed cloud mode.

## Current Status

This app can run in two modes:

### Cloud mode

When Supabase config is available:

- users sign in with email/password
- data is separated per authenticated user
- clients, quotes, rooms, invoices, calendar entries, and settings are stored in Supabase
- photos and logos are stored in a private Supabase Storage bucket
- signed media URLs are regenerated when the workspace loads

### Preview mode

When Supabase is not configured:

- the app still opens for preview/testing
- legacy browser data can be loaded from localStorage
- JSON backup/export still works
- uploaded preview images are stored locally in the browser only

## Project Structure

```text
index.html
package.json
vite.config.js
src/
  main.js
  styles.css
  lib/
    constants.js
    pdf.js
    repository.js
    supabase.js
    utils.js
    validation.js
supabase/
  schema.sql
.env.example
```

## What This Phase Includes

- Supabase-ready data layer
- Authentication scaffolding with per-user workspace separation
- Supabase Storage support for photo attachments and business logo uploads
- Existing app flow preserved:
  - Dashboard
  - Calendar
  - Client Database
  - Current Job
- Room-by-room quoting workflow
- VAT, discounts, deposit handling, invoice generation, and `.ics` export
- Branded quotation and invoice PDFs with:
  - uploaded logo
  - business details
  - payment terms
  - acceptance notes
  - room breakdown
- JSON import/export as a backup path
- Validation for:
  - client details
  - room input
  - quote totals
  - invoice due dates
  - photo upload size/type

## Recent Hardening Fixes

- Pinned frontend dependency versions instead of using `latest`.
- Simplified the Vite config and added relative asset output with `base: "./"` for GitHub Pages/static hosting.
- Made `supabase/schema.sql` safer to rerun by wrapping policy creation in existence checks.
- Ensured the `auty-media` bucket remains private if the schema is rerun.
- Changed cloud media persistence so expiring signed URLs are not stored as durable database data.
- Rehydrated photo/logo signed URLs from their storage paths when workspace data loads.
- Reused the same generated photo ID for both the database record and the uploaded storage filename.
- Added storage cleanup when a cloud photo record is deleted.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql).
3. Create a `.env` file based on [`.env.example`](./.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

4. Make sure Email/Password auth is enabled in Supabase Authentication.
5. Keep the `auty-media` storage bucket private. The app uses signed URLs for logo and photo display.

## Running The App

```bash
npm install
npm run dev
```

Then open the local Vite URL, usually:

```text
http://localhost:5173
```

For a production build:

```bash
npm run build
npm run preview
```

The app can also still be previewed directly through [`index.html`](./index.html) using import maps and CDN-delivered dependencies, which is useful when package tooling is not available.

## Data Model Direction

The current Supabase phase uses dedicated tables per entity with a `payload` JSON column and `user_id` ownership:

- `workspace_settings`
- `clients`
- `quotes`
- `rooms`
- `photos`
- `invoices`
- `calendar_entries`

This keeps the current UI model stable while leaving room to normalise the database further later.

## Validation Included

- Client save:
  - surname required
  - phone or email required
  - email format checked
- Quote generation:
  - client required
  - at least one room required
  - deposit cannot exceed total
- Invoice generation:
  - due date required
  - due date cannot be before invoice date
  - deposit paid cannot exceed total
- Photo upload:
  - image files only
  - max 5 MB
  - must be linked to client, quote and room

## Calendar Sync Preparation

The app still exports `.ics` files, but calendar entries include future sync fields so Google Calendar or Apple Calendar sync can be layered on later:

- `syncStatus`
- `externalCalendarId`
- `externalEventId`
- `externalProvider`

## Still Worth Doing Next

- Run a full local `npm install && npm run build` check.
- Test the full live Supabase flow from sign-up to quote, invoice, photo upload, backup export, and delete.
- Add password reset.
- Add an invite/staff flow if multiple decorators will use one business workspace.
- Add CI so GitHub checks the build automatically on every commit.
- Eventually split `src/main.js` into smaller feature components.
