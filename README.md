# AUTY Decorating Workspace

AUTY Decorating Workspace is a browser-based React workspace for a sole trader or small decorating business. This version keeps the existing AUTY flow intact while preparing the app for a production-ready next phase with Supabase auth, cloud data, storage-backed media, improved PDFs, and stronger validation.

## What Changed In This Phase

- Replaced the browser-only data model with a Supabase-ready data layer.
- Added authentication scaffolding with per-user workspace separation.
- Added Supabase Storage support for photo attachments and business logo uploads.
- Preserved the existing tab flow:
  - Dashboard
  - Calendar
  - Client Database
  - Current Job
- Kept the room-by-room quoting workflow, VAT, discounts, deposit handling, invoice generation, and `.ics` export.
- Upgraded quotation and invoice PDF generation to support:
  - uploaded logo
  - business details
  - payment terms
  - acceptance notes
  - cleaner branded layout
- Kept JSON import/export as a safety backup path rather than the main store.
- Added validation for:
  - client details
  - room input
  - quote totals
  - invoice due dates
  - photo upload size/type

## Project Structure

```text
index.html
package.json
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

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [supabase/schema.sql](/Users/nickjones/Documents/Auty%20App/supabase/schema.sql).
3. Create a `.env` file based on [.env.example](/Users/nickjones/Documents/Auty%20App/.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

4. Make sure Email/Password auth is enabled in Supabase Authentication.
5. Keep the `auty-media` storage bucket private. The app uses signed URLs for logo and photo display.

## Running The App

If you have Node and npm installed:

```bash
npm install
npm run dev
```

Then open the local Vite URL, usually `http://localhost:5173`.

This repository also still supports direct static browser loading through [index.html](/Users/nickjones/Documents/Auty%20App/index.html) using import maps and CDN-delivered dependencies, which is useful for previewing when package tooling is not available.

## Current Runtime Modes

### Cloud mode

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set:

- users sign in with email/password
- data is separated per authenticated user
- clients, quotes, rooms, invoices, calendar entries, and settings are stored in Supabase
- photos and logos use Supabase Storage

### Preview mode

When Supabase is not configured:

- the app still opens
- legacy browser data is loaded for preview/testing
- localStorage remains only as a fallback preview path
- JSON backup/export still works

## Data Model Direction

The production-ready step uses dedicated Supabase tables per entity with a `payload` JSON column and `user_id` ownership:

- `workspace_settings`
- `clients`
- `quotes`
- `rooms`
- `photos`
- `invoices`
- `calendar_entries`

This keeps the current UI model stable while making it straightforward to normalise further in a later backend phase.

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

The app still exports `.ics` files, but calendar entries are now structured with future sync fields so Google Calendar or Apple Calendar sync can be layered on later without replacing the current model:

- `syncStatus`
- `externalCalendarId`
- `externalEventId`
- `externalProvider`

## Production-Phase Notes

This phase prepares the app well for a real rollout, but a few things still need finishing once Supabase credentials are available:

- test the auth flow against a live Supabase project
- verify RLS and storage policies in the actual environment
- run a full Vite production build once package tooling is installed locally
- optionally replace JSON `payload` tables with more fully normalised relational tables later
- add password reset, invite flow, and email templates if multiple staff accounts are planned
- add actual Google/Apple calendar sync adapters on top of the prepared calendar model

## Dependencies

- React
- Vite
- Tailwind CSS
- jsPDF
- lucide-react
- `@supabase/supabase-js`

