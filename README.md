# AUTY Decorating Workspace MVP

A regenerated browser-based React app for managing decorating clients, room-by-room quotations, totals, calendar bookings, photo attachments, PDF quotations, final invoices, and JSON backups.

## Run

If you have Node and npm installed:

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

This workspace was also built to run directly from `index.html` using CDN imports for local review where npm is unavailable. The entry script uses a relative path so it can be hosted on GitHub Pages as a static site.

## Main Dependencies

- React with Vite
- Tailwind CSS
- jsPDF for quotation and invoice PDFs
- lucide-react for interface icons
- localStorage for MVP persistence

## What Is Included

- Regenerated dashboard with fast-start client and quote creation.
- Dashboard with key job, quote, invoice, deposit and blocked-date cards.
- Client database with broad search and editable client profiles.
- Room-by-room AUTY Job Quoter with 0.5 day increments, day-rate pricing, materials, editable generated descriptions and price overrides.
- Completing or adding a room saves it and clears the form ready for the next room.
- Quotation overview with discount, VAT, deposit and remainder calculations.
- Quote PDF generation with AUTY branding, room breakdown, totals, VAT and acceptance section.
- Final invoice generation from a quote with editable due date, deposit paid and invoice status.
- Photo attachments assigned to client, quote and room.
- Business calendar list with colour-coded entry types, overlap warning and `.ics` export for Apple Calendar import.
- Settings for day rate, VAT, default deposit, business details, payment details and JSON import/export backup.

## MVP Limitations

- Data is stored locally in the browser only.
- No login, permissions, backend database or live calendar sync.
- PDF design is clean and functional rather than fully branded stationery.
- Photo storage uses browser localStorage, so large image libraries should move to real file/blob storage in the next phase.

## Suggested Next Phase

- Add a backend with user accounts and cloud backup.
- Replace localStorage photos with object storage.
- Add quote acceptance status workflow and invoice payment tracking.
- Improve PDF templates with logo upload and richer page layout.
- Add real calendar sync once Apple/Google calendar integration is selected.
