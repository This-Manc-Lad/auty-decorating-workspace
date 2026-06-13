import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { initialState, STORAGE_KEY } from "../src/lib/constants.js";

function expectSinglePagePdf(download) {
  return download.path().then((path) => {
    const pdf = readFileSync(path).toString("latin1");
    expect((pdf.match(/\/Type\s*\/Page\b/g) || []).length).toBe(1);
  });
}

test("the refreshed workspace navigation and key controls work", async ({ page }) => {
  await page.goto("/?preview");

  await expect(page.getByText("Welcome Back")).toBeVisible();
  await expect(page.locator(".auty-welcome")).toHaveCSS("position", "fixed");
  await expect(page.locator(".auty-welcome")).toHaveCSS("animation-name", "welcomePaintAway");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await expect(page.getByRole("img", { name: "AUTY Decorating logo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
  await expect(page.getByLabel("Open Settings tab")).toBeVisible();
  await expect(page.locator(".auty-bottom-dock")).toHaveCSS("position", "fixed");
  const dockBeforeScroll = await page.locator(".auty-bottom-dock").boundingBox();
  await page.getByLabel("Open Settings tab").click();
  await expect(page.getByLabel("Open Settings tab")).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".auty-settings-page")).toBeVisible();
  await expect(page.locator(".auty-settings-page")).toHaveCSS("position", "relative");
  await expect(page.getByLabel("Default Deposit")).toHaveValue("50%");
  await expect(page.getByLabel("Decorator Name")).toBeVisible();
  await page.getByRole("button", { name: "Back to Dashboard" }).click();
  await expect(page.getByText("Today’s Job")).toBeVisible();
  const buttonGradients = await page.locator("button").evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).backgroundImage));
  expect(buttonGradients.every((value) => value === "none")).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[data-auty-top-dock="true"]')).toHaveAttribute("data-compact", "true");
  const dockAfterScroll = await page.locator(".auty-bottom-dock").boundingBox();
  expect(Math.abs(dockAfterScroll.y - dockBeforeScroll.y)).toBeLessThan(2);
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.getByLabel("Calendar", { exact: true }).click();
  await expect(page.getByText("Business Calendar")).toBeVisible();
  await page.getByLabel("Open Settings tab").click();
  await expect(page.getByRole("button", { name: "Back to Calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Back to Calendar" }).click();
  await expect(page.getByText("Business Calendar")).toBeVisible();
  await expect(page.locator('[aria-label="Calendar colour key"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Calendar Key" }).click();
  await expect(page.locator('[aria-label="Calendar colour key"]')).toBeVisible();

  const dateCell = page.locator('.auty-calendar-cell button[aria-label*="no entries"]').first();
  await dateCell.click();
  await expect(dateCell).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Book this date" })).toBeVisible();
  await page.getByRole("button", { name: "Book this date" }).click();
  await expect(page.getByLabel("Start Date")).toHaveValue(await dateCell.getAttribute("aria-label").then((label) => {
    const parsed = new Date(label.split(",")[0]);
    const offset = parsed.getTimezoneOffset();
    return new Date(parsed.getTime() - offset * 60000).toISOString().slice(0, 10);
  }));

  await page.getByLabel("Quoter", { exact: true }).click();
  await page.getByRole("button", { name: "Room Quoter" }).click();
  await expect(page.getByRole("button", { name: "New Quote / New Client" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Quote / Existing Client" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Room Woodwork" })).toHaveCount(0);

  const roomQuoterTab = page.getByRole("button", { name: "Room Quoter" });
  await expect(roomQuoterTab).toHaveAttribute("aria-pressed", "true");
});

test("new-client quote flow saves minimum details before showing rooms", async ({ page }) => {
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Quoter", { exact: true }).click();
  await page.getByRole("button", { name: "New Quote / New Client" }).click();
  await page.getByLabel("Client Name").fill("Casey Reed");
  await page.getByLabel("Phone Number").fill("07111111111");
  await page.getByLabel("Email Address").fill("casey@example.com");
  await page.getByLabel("Job Address").fill("8 Park Avenue");
  await page.getByRole("button", { name: "Save Client & Load Room Options" }).click();
  await expect(page.getByRole("heading", { name: "Room", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Room Woodwork" })).toBeVisible();
});

test("existing-client quoter flow reveals room options only after selection", async ({ page }) => {
  const workspace = {
    ...initialState,
    clients: [{ clientId: "client-existing", givenName: "Jamie", surname: "Morgan", telephone: "07123456789", email: "jamie@example.com", address: "22 Market Road" }]
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Quoter", { exact: true }).click();
  await page.getByRole("button", { name: "New Quote / Existing Client" }).click();
  await page.getByLabel("Existing Client").selectOption("client-existing");
  await expect(page.getByText("22 Market Road", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create Quote & Load Room Options" }).click();
  await expect(page.getByRole("heading", { name: "Room Woodwork" })).toBeVisible();
  await expect(page.getByText("Window Sill", { exact: true })).toBeVisible();
  const materials = page.getByLabel("Materials Cost");
  await materials.fill("125.50");
  await expect(materials).toHaveValue("125.50");
  await materials.fill("");
  await expect(materials).toHaveValue("");
  await materials.fill("125.50");
  await page.getByRole("button", { name: "Complete Room" }).click();
  await page.getByRole("button", { name: "Go to Job Overview" }).click();
  await expect(page.getByText("Materials total").locator("..")).toContainText("£125.50");
  await page.getByLabel("Quote Date").fill("2026-07-01");
  await page.getByLabel("Proposed Start Date").fill("2026-07-08");
  const quoteDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate Quote PDF" }).click();
  await expectSinglePagePdf(await quoteDownloadPromise);

  await page.getByRole("button", { name: "Invoice Generator" }).click();
  await page.getByLabel("Invoice Date").fill("2026-07-10");
  await page.getByLabel("Payment Due Date").fill("2026-07-24");
  await page.getByRole("button", { name: "Save Invoice Changes" }).click();
  const invoiceDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate Final Invoice" }).click();
  await expectSinglePagePdf(await invoiceDownloadPromise);
});

test("calendar entries can be titled, edited, overridden, and deleted", async ({ page }) => {
  const workspace = {
    ...initialState,
    calendarEntries: [{
      calendarEntryId: "cal-edit",
      title: "Original booking",
      type: "Other Work",
      startDate: "2026-06-12",
      endDate: "2026-06-12",
      notes: "Initial note"
    }]
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Calendar", { exact: true }).click();
  await page.getByLabel("Edit Original booking").click();
  await expect(page.getByRole("heading", { name: "Edit Booking" })).toBeVisible();
  await page.getByLabel("Type").selectOption("Quote Visit");
  await expect(page.getByLabel("Title")).toHaveValue("Original booking · Quote Visit");
  await page.getByLabel("Start Date").fill("2026-06-18");
  await page.getByLabel("End Date").fill("2026-06-20");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Original booking · Quote Visit", { exact: true })).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  const edited = stored.calendarEntries.find((entry) => entry.calendarEntryId === "cal-edit");
  expect(edited.startDate).toBe("2026-06-18");
  expect(edited.endDate).toBe("2026-06-20");
  expect(edited.type).toBe("Quote Visit");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Delete Original booking · Quote Visit").click();
  await expect(page.getByText("Original booking · Quote Visit", { exact: true })).toHaveCount(0);
});

test("reminders can be created and surfaced on the dashboard", async ({ page }) => {
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Calendar", { exact: true }).click();
  await page.getByLabel("Title").fill("Order hallway paint");
  await page.getByLabel("Type").selectOption("Reminder");
  await expect(page.getByLabel("Reminder Category")).toBeVisible();
  await page.getByLabel("Reminder Category").selectOption("Materials to order");
  await page.getByRole("button", { name: "Save Calendar Entry" }).click();
  await page.getByLabel("Dashboard", { exact: true }).click();
  await expect(page.getByRole("button", { name: /Order hallway paint/ })).toBeVisible();
});

test("client database views and multi-day calendar bands are available", async ({ page }) => {
  const date = new Date();
  const first = date.toISOString().slice(0, 10);
  date.setDate(date.getDate() + 2);
  const last = date.toISOString().slice(0, 10);
  const workspace = {
    ...initialState,
    clients: [{ clientId: "client-db", givenName: "Robin", surname: "Lane", telephone: "07000000000", email: "robin@example.com", address: "4 Station View" }],
    quotes: [{ quoteId: "quote-db", clientId: "client-db", quoteReference: "AUTY-Q-DB", quoteDate: first, quoteStatus: "Sent", depositType: "50%", depositAmount: 250, totalAmount: 500, roomIds: [], discountType: "No Discount", vatEnabled: false }],
    invoices: [{ invoiceId: "invoice-db", clientId: "client-db", quoteId: "quote-db", invoiceReference: "AUTY-INV-DB", invoiceDate: first, paymentDueDate: last, jobTotal: 500, depositPaid: 100, balanceDue: 400, invoiceStatus: "Unpaid" }],
    calendarEntries: [{ calendarEntryId: "job-db", clientId: "client-db", quoteId: "quote-db", title: "Lane job", type: "Booked Job", startDate: first, endDate: last }]
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Calendar", { exact: true }).click();
  await expect(page.locator('.auty-calendar-cell[data-band="start"]')).toHaveCount(1);
  await expect(page.locator('.auty-calendar-cell[data-band="middle"]')).toHaveCount(1);
  await expect(page.locator('.auty-calendar-cell[data-band="end"]')).toHaveCount(1);
  await page.getByLabel("Clients", { exact: true }).click();
  await page.getByRole("button", { name: "Invoices", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AUTY-INV-DB · Robin Lane" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chase Payment" })).toBeVisible();
  const chase = page.getByRole("button", { name: "Chase Payment" });
  await expect(chase).toHaveAttribute("data-email-subject", "Payment reminder for invoice AUTY-INV-DB");
  await expect(chase).toHaveAttribute("data-email-body", /Hi Robin Lane,[\s\S]*£400.00[\s\S]*AUTY Decorating/);
  await page.getByRole("button", { name: "Quotes Database" }).click();
  await expect(page.getByRole("heading", { name: "AUTY-Q-DB · Robin Lane" })).toBeVisible();
});

test("contacts can be added, edited, saved, loaded, and deleted", async ({ page }) => {
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });
  await page.getByLabel("Clients", { exact: true }).click();
  await page.getByRole("button", { name: "Add Client" }).click();
  await page.getByLabel("Surname").fill("North");
  await page.getByLabel("Given Name").fill("Sam");
  await page.getByLabel("Phone Number").fill("07222222222");
  await page.getByLabel("E-Mail").fill("sam@example.com");
  await page.getByLabel("Address").fill("15 Bridge Street");
  await page.getByLabel("Save client").click();
  await expect(page.getByText("North", { exact: true })).toBeVisible();
  await page.getByLabel("Open client details").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Client" }).click();
  await expect(page.getByText("North", { exact: true })).toHaveCount(0);
});

test("dashboard priorities and invoice payment statuses are actionable", async ({ page }) => {
  const date = new Date().toISOString().slice(0, 10);
  const workspace = {
    ...initialState,
    clients: [{ clientId: "client-test", givenName: "Alex", surname: "Taylor", telephone: "07123456789", email: "alex@example.com", address: "10 High Street, London" }],
    quotes: [{
      quoteId: "quote-test",
      clientId: "client-test",
      quoteReference: "AUTY-Q-001",
      quoteDate: date,
      proposedStartDate: date,
      quoteStatus: "Sent",
      depositType: "50%",
      depositCustom: 0,
      vatEnabled: false,
      discountType: "No Discount",
      discountPercent: 0,
      customDiscount: 0,
      roomIds: [],
      totalAmount: 500,
      wholeJobSpecifics: "Hallway decorating"
    }],
    invoices: [{ invoiceId: "invoice-test", clientId: "client-test", quoteId: "quote-test", invoiceReference: "AUTY-INV-001", invoiceDate: date, paymentDueDate: date, jobTotal: 500, depositPaid: 0, balanceDue: 500, invoiceStatus: "Unpaid" }],
    calendarEntries: [{ calendarEntryId: "cal-test", clientId: "client-test", quoteId: "quote-test", title: "Taylor hallway", type: "Booked Job", startDate: date, endDate: date, startTime: "09:00", notes: "" }]
  };

  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.goto("/?preview");
  await expect(page.getByText("Welcome Back")).toBeHidden({ timeout: 5000 });

  await expect(page.getByRole("heading", { name: "Taylor hallway" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Outstanding Quotes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unpaid Invoices" })).toBeVisible();
  await expect(page.getByText("Keep jobs moving, quotes clear, and payment follow-up tidy.")).toHaveCount(0);

  await page.getByLabel("Quoter", { exact: true }).click();
  await page.getByRole("button", { name: "Invoice Generator" }).click();
  await expect(page.locator('[data-invoice-generator-form="true"]').getByRole("button", { name: "Chase Payment" })).toHaveCount(0);
  const savedInvoice = page.locator('[data-invoice-id="invoice-test"]');
  await savedInvoice.getByRole("button", { name: "Paid", exact: true }).click();
  await expect(savedInvoice.getByRole("button", { name: "Paid", exact: true })).toHaveAttribute("aria-pressed", "true");
});
