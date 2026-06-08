const VERSION = "2.6";
const REMINDER_KEY = "auty-v26-reminders";
const ARCHIVE_KEY = "auty-v26-archive";

function textOf(node) {
  return node?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readReminders() {
  return readJson(REMINDER_KEY, []);
}

function saveReminders(reminders) {
  writeJson(REMINDER_KEY, reminders);
}

function reminderStatus(reminder) {
  if (reminder.archived) return "Archived";
  if (reminder.completed) return "Complete";
  if (reminder.dueDate && reminder.dueDate < todayStamp()) return "Overdue";
  if (reminder.dueDate === todayStamp()) return "Today";
  return "Upcoming";
}

function findHeading(label) {
  return Array.from(document.querySelectorAll("h1, h2, h3, p"))
    .find((node) => textOf(node) === label || textOf(node).startsWith(label));
}

function activeMainTitle() {
  const header = document.querySelector("header h1");
  return textOf(header);
}

function clickNav(label) {
  Array.from(document.querySelectorAll("button"))
    .find((button) => textOf(button) === label)
    ?.click();
}

function clickJobTab(label) {
  Array.from(document.querySelectorAll("button"))
    .find((button) => textOf(button) === label)
    ?.click();
}

function ensureStyle() {
  if (document.getElementById("auty-v26-style")) return;
  const style = document.createElement("style");
  style.id = "auty-v26-style";
  style.textContent = `
    .auty-v26-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: .22rem .55rem;
      background: rgba(0,184,198,.12);
      border: 1px solid rgba(0,184,198,.25);
      color: #0f766e;
      font-size: .66rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .auty-v26-hide {
      display: none !important;
    }

    .auty-v26-dashboard {
      display: grid;
      gap: .9rem;
      margin-top: 1rem;
    }

    .auty-v26-panel {
      border-radius: 1.65rem;
      border: 1px solid rgba(255,255,255,.58);
      background: linear-gradient(135deg, rgba(255,255,255,.62), rgba(255,255,255,.28));
      box-shadow: 0 18px 42px rgba(15,23,42,.11), inset 0 1px 0 rgba(255,255,255,.74);
      backdrop-filter: blur(22px) saturate(1.12);
      padding: 1rem;
      color: #0f172a;
    }

    .auty-v26-panel h3 {
      margin: 0 0 .7rem;
      font-size: 1.2rem;
      color: #0f172a;
    }

    .auty-v26-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .7rem;
    }

    .auty-v26-kpi {
      border-radius: 1.25rem;
      background: rgba(255,255,255,.48);
      border: 1px solid rgba(255,255,255,.58);
      padding: .85rem;
      min-height: 5.1rem;
    }

    .auty-v26-kpi span {
      display: block;
      color: #64748b;
      font-size: .82rem;
      font-weight: 800;
    }

    .auty-v26-kpi strong {
      display: block;
      margin-top: .22rem;
      font-size: 1.85rem;
      color: #020617;
      line-height: 1;
    }

    .auty-v26-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .65rem;
      margin-top: .8rem;
    }

    .auty-v26-actions button,
    .auty-v26-button {
      border: 0;
      border-radius: 1.15rem;
      min-height: 3.1rem;
      padding: .8rem 1rem;
      background: linear-gradient(135deg, #00b8c6, #12c7b8);
      color: #061019;
      font-weight: 950;
      box-shadow: 0 15px 34px rgba(0,184,198,.22), inset 0 1px 0 rgba(255,255,255,.36);
    }

    .auty-v26-secondary {
      background: rgba(255,255,255,.44) !important;
      border: 1px solid rgba(255,255,255,.62) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.62), 0 12px 24px rgba(15,23,42,.08) !important;
      color: #0f172a !important;
    }

    .auty-v26-reminder-tabs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .45rem;
      margin: .75rem 0 1rem;
      padding: .28rem;
      border-radius: 999px;
      background: rgba(255,255,255,.42);
      border: 1px solid rgba(255,255,255,.62);
      backdrop-filter: blur(18px);
    }

    .auty-v26-reminder-tabs button {
      border: 0;
      border-radius: 999px;
      padding: .72rem .9rem;
      background: transparent;
      color: #475569;
      font-weight: 900;
    }

    .auty-v26-reminder-tabs button[data-active="true"] {
      background: linear-gradient(135deg, #00b8c6, #12c7b8);
      color: #061019;
      box-shadow: 0 10px 24px rgba(0,184,198,.20), inset 0 1px 0 rgba(255,255,255,.34);
    }

    .auty-v26-reminder-view {
      display: grid;
      gap: .8rem;
    }

    .auty-v26-field {
      display: grid;
      gap: .35rem;
    }

    .auty-v26-field label {
      font-size: .76rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .11em;
    }

    .auty-v26-field input,
    .auty-v26-field select,
    .auty-v26-field textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,.64);
      border-radius: 1rem;
      padding: .85rem .95rem;
      background: rgba(255,255,255,.55);
      color: #0f172a;
      outline: none;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
    }

    .auty-v26-reminder-card,
    .auty-v26-library-card {
      border-radius: 1.25rem;
      background: rgba(255,255,255,.52);
      border: 1px solid rgba(255,255,255,.62);
      padding: .85rem;
      box-shadow: 0 12px 26px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.62);
    }

    .auty-v26-reminder-card[data-status="Overdue"] {
      background: linear-gradient(135deg, rgba(254,226,226,.78), rgba(255,255,255,.46));
      border-color: rgba(248,113,113,.35);
    }

    .auty-v26-reminder-card[data-status="Today"] {
      background: linear-gradient(135deg, rgba(254,243,199,.78), rgba(255,255,255,.46));
      border-color: rgba(245,158,11,.32);
    }

    .auty-v26-reminder-card[data-status="Complete"] {
      opacity: .68;
    }

    .auty-v26-card-title {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .65rem;
    }

    .auty-v26-card-title strong {
      display: block;
      color: #0f172a;
      font-size: 1rem;
    }

    .auty-v26-card-title span,
    .auty-v26-muted {
      color: #64748b;
      font-size: .85rem;
    }

    .auty-v26-status {
      display: inline-flex;
      border-radius: 999px;
      padding: .28rem .55rem;
      font-size: .7rem;
      font-weight: 900;
      background: rgba(15,23,42,.08);
      color: #334155;
      white-space: nowrap;
    }

    .auty-v26-status[data-tone="blue"] { background: #dbeafe; color: #1d4ed8; }
    .auty-v26-status[data-tone="amber"] { background: #fef3c7; color: #92400e; }
    .auty-v26-status[data-tone="red"] { background: #fee2e2; color: #991b1b; }
    .auty-v26-status[data-tone="green"] { background: #dcfce7; color: #166534; }
    .auty-v26-status[data-tone="grey"] { background: #e2e8f0; color: #475569; }

    .auty-v26-card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      margin-top: .7rem;
    }

    .auty-v26-card-actions button {
      border: 0;
      border-radius: 999px;
      padding: .55rem .75rem;
      background: rgba(255,255,255,.70);
      color: #0f172a;
      font-size: .78rem;
      font-weight: 900;
    }

    .auty-v26-library {
      display: grid;
      gap: .8rem;
      margin-top: .8rem;
    }

    .auty-v26-pdf-note {
      margin-top: .75rem;
      border-radius: 1.15rem;
      padding: .75rem .9rem;
      background: rgba(0,184,198,.10);
      border: 1px solid rgba(0,184,198,.18);
      color: #0f766e;
      font-size: .85rem;
      font-weight: 800;
    }

    @media (max-width: 720px) {
      .auty-v26-dashboard,
      .auty-v26-grid-2,
      .auty-v26-actions {
        grid-template-columns: 1fr 1fr;
      }

      .auty-v26-panel {
        border-radius: 1.35rem;
        padding: .85rem;
      }

      .auty-v26-kpi strong {
        font-size: 1.55rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureVersionBadge() {
  const existing = document.querySelector(".auty-v26-badge");
  if (existing) {
    existing.textContent = `v${VERSION}`;
    return;
  }
  const header = document.querySelector("header");
  const status = Array.from(header?.querySelectorAll("span, p") || [])
    .find((node) => /Cloud synced|Preview mode|Awaiting sign-in|Cloud setup/i.test(textOf(node)));
  if (!status) return;
  const badge = document.createElement("span");
  badge.className = "auty-v26-badge";
  badge.textContent = `v${VERSION}`;
  status.parentElement?.appendChild(badge);
}

function countsFromDashboard() {
  const labels = ["Jobs", "Quotes", "Invoices", "Blocked"];
  const result = {};
  labels.forEach((label) => {
    const node = Array.from(document.querySelectorAll("p, span, div"))
      .find((item) => textOf(item) === label);
    const card = node?.closest("div[class*='rounded']") || node?.parentElement;
    const numberNode = Array.from(card?.querySelectorAll("p, strong, div") || [])
      .map(textOf)
      .find((text) => /^\d+$/.test(text));
    result[label] = Number(numberNode || 0);
  });
  return result;
}

function renderDashboard() {
  if (activeMainTitle() !== "Dashboard") return;
  const todayLabel = findHeading("Today");
  const hero = todayLabel?.closest("section") || todayLabel?.parentElement;
  if (!hero || hero.querySelector(".auty-v26-dashboard")) return;

  Array.from(hero.children).forEach((child) => child.classList.add("auty-v26-hide"));
  const counts = countsFromDashboard();
  const reminders = readReminders().filter((item) => !item.archived);
  const overdue = reminders.filter((item) => reminderStatus(item) === "Overdue").length;
  const dueToday = reminders.filter((item) => reminderStatus(item) === "Today").length;

  const dashboard = document.createElement("div");
  dashboard.className = "auty-v26-dashboard";
  dashboard.innerHTML = `
    <div class="auty-v26-panel">
      <h3>Today</h3>
      <div class="auty-v26-grid-2">
        <div class="auty-v26-kpi"><span>Active jobs</span><strong>${counts.Jobs || 0}</strong></div>
        <div class="auty-v26-kpi"><span>Quotes awaiting</span><strong>${counts.Quotes || 0}</strong></div>
        <div class="auty-v26-kpi"><span>Invoices open</span><strong>${counts.Invoices || 0}</strong></div>
        <div class="auty-v26-kpi"><span>Blocked dates</span><strong>${counts.Blocked || 0}</strong></div>
      </div>
      <div class="auty-v26-actions">
        <button type="button" data-action="current-job">Open Current Job</button>
        <button type="button" data-action="calendar" class="auty-v26-secondary">Calendar / Directions</button>
      </div>
    </div>
    <div class="auty-v26-panel">
      <h3>Reminders</h3>
      <div class="auty-v26-grid-2">
        <div class="auty-v26-kpi"><span>Due today</span><strong>${dueToday}</strong></div>
        <div class="auty-v26-kpi"><span>Overdue</span><strong>${overdue}</strong></div>
      </div>
      <div class="auty-v26-library" data-dashboard-reminders></div>
      <div class="auty-v26-actions">
        <button type="button" data-action="reminders">Open Reminders</button>
        <button type="button" data-action="new-quote" class="auty-v26-secondary">New Quote</button>
      </div>
    </div>
  `;
  hero.appendChild(dashboard);

  dashboard.querySelector('[data-action="current-job"]')?.addEventListener("click", () => clickNav("Current Job"));
  dashboard.querySelector('[data-action="calendar"]')?.addEventListener("click", () => clickNav("Calendar"));
  dashboard.querySelector('[data-action="reminders"]')?.addEventListener("click", () => {
    clickNav("Calendar");
    setTimeout(() => document.querySelector('[data-auty-reminder-tab="reminders"]')?.click(), 250);
  });
  dashboard.querySelector('[data-action="new-quote"]')?.addEventListener("click", () => {
    clickNav("Current Job");
    setTimeout(() => clickJobTab("Room Quoter"), 150);
  });

  const list = dashboard.querySelector("[data-dashboard-reminders]");
  const topReminders = reminders
    .filter((item) => ["Overdue", "Today", "Upcoming"].includes(reminderStatus(item)))
    .sort((a, b) => `${a.dueDate || "9999"}${a.priority}`.localeCompare(`${b.dueDate || "9999"}${b.priority}`))
    .slice(0, 3);

  list.innerHTML = topReminders.length
    ? topReminders.map((item) => reminderCardHtml(item, true)).join("")
    : `<p class="auty-v26-muted">No reminders yet. Add one from Calendar → Reminders.</p>`;
}

function reminderCardHtml(item, compact = false) {
  const status = reminderStatus(item);
  const tone = status === "Overdue" ? "red" : status === "Today" ? "amber" : status === "Complete" ? "green" : "blue";
  return `
    <div class="auty-v26-reminder-card" data-reminder-id="${item.id}" data-status="${status}">
      <div class="auty-v26-card-title">
        <div>
          <strong>${item.title || "Untitled reminder"}</strong>
          <span>${item.dueDate || "No due date"}${item.linkedTo ? ` · ${item.linkedTo}` : ""}</span>
        </div>
        <span class="auty-v26-status" data-tone="${tone}">${status}</span>
      </div>
      ${item.notes && !compact ? `<p class="auty-v26-muted">${item.notes}</p>` : ""}
      ${compact ? "" : `<div class="auty-v26-card-actions">
        <button type="button" data-reminder-complete="${item.id}">${item.completed ? "Reopen" : "Done"}</button>
        <button type="button" data-reminder-archive="${item.id}">Archive</button>
        <button type="button" data-reminder-delete="${item.id}">Delete</button>
      </div>`}
    </div>
  `;
}

function renderRemindersView(container) {
  const reminders = readReminders();
  const active = reminders.filter((item) => !item.archived);
  const archived = reminders.filter((item) => item.archived);
  container.innerHTML = `
    <div class="auty-v26-reminder-view">
      <div class="auty-v26-panel">
        <h3>Add Reminder</h3>
        <div class="auty-v26-grid-2">
          <div class="auty-v26-field"><label>Title</label><input data-reminder-title placeholder="Call client / Chase quote / Buy materials"></div>
          <div class="auty-v26-field"><label>Due date</label><input data-reminder-date type="date" value="${todayStamp()}"></div>
          <div class="auty-v26-field"><label>Priority</label><select data-reminder-priority><option>Normal</option><option>Urgent</option><option>Low</option></select></div>
          <div class="auty-v26-field"><label>Linked to</label><input data-reminder-link placeholder="Client, quote or job reference"></div>
        </div>
        <div class="auty-v26-field" style="margin-top:.7rem"><label>Notes</label><textarea data-reminder-notes rows="3" placeholder="Optional detail"></textarea></div>
        <div class="auty-v26-actions"><button type="button" data-reminder-save>Save Reminder</button></div>
      </div>
      <div class="auty-v26-panel">
        <h3>Active Reminders</h3>
        <div class="auty-v26-library" data-reminder-list>${active.length ? active.map((item) => reminderCardHtml(item)).join("") : `<p class="auty-v26-muted">No active reminders.</p>`}</div>
      </div>
      <div class="auty-v26-panel">
        <h3>Archive</h3>
        <div class="auty-v26-library">${archived.length ? archived.map((item) => reminderCardHtml(item)).join("") : `<p class="auty-v26-muted">No archived reminders.</p>`}</div>
      </div>
    </div>
  `;

  container.querySelector("[data-reminder-save]")?.addEventListener("click", () => {
    const title = container.querySelector("[data-reminder-title]")?.value?.trim();
    if (!title) return alert("Add a reminder title.");
    const next = [
      {
        id: `rem-${crypto.randomUUID()}`,
        title,
        dueDate: container.querySelector("[data-reminder-date]")?.value || todayStamp(),
        priority: container.querySelector("[data-reminder-priority]")?.value || "Normal",
        linkedTo: container.querySelector("[data-reminder-link]")?.value?.trim() || "",
        notes: container.querySelector("[data-reminder-notes]")?.value?.trim() || "",
        completed: false,
        archived: false,
        createdAt: new Date().toISOString()
      },
      ...readReminders()
    ];
    saveReminders(next);
    renderRemindersView(container);
  });

  container.querySelectorAll("[data-reminder-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-reminder-complete");
      saveReminders(readReminders().map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
      renderRemindersView(container);
    });
  });

  container.querySelectorAll("[data-reminder-archive]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-reminder-archive");
      saveReminders(readReminders().map((item) => item.id === id ? { ...item, archived: true } : item));
      renderRemindersView(container);
    });
  });

  container.querySelectorAll("[data-reminder-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-reminder-delete");
      saveReminders(readReminders().filter((item) => item.id !== id));
      renderRemindersView(container);
    });
  });
}

function installCalendarReminderTabs() {
  if (activeMainTitle() !== "Calendar") return;
  const businessCalendar = findHeading("Business Calendar");
  const section = businessCalendar?.closest("section");
  const page = section?.parentElement;
  if (!section || !page || page.querySelector(".auty-v26-reminder-tabs")) return;

  const tabs = document.createElement("div");
  tabs.className = "auty-v26-reminder-tabs";
  tabs.innerHTML = `
    <button type="button" data-auty-reminder-tab="calendar" data-active="true">Calendar</button>
    <button type="button" data-auty-reminder-tab="reminders">Reminders</button>
  `;
  section.insertBefore(tabs, section.children[1] || null);

  const reminderHost = document.createElement("div");
  reminderHost.className = "auty-v26-reminder-host auty-v26-hide";
  section.appendChild(reminderHost);
  renderRemindersView(reminderHost);

  const calendarChildren = Array.from(section.children).filter((child) => child !== tabs && child !== reminderHost && !child.contains(businessCalendar));

  tabs.querySelector('[data-auty-reminder-tab="calendar"]')?.addEventListener("click", () => {
    tabs.querySelectorAll("button").forEach((button) => button.dataset.active = "false");
    tabs.querySelector('[data-auty-reminder-tab="calendar"]').dataset.active = "true";
    reminderHost.classList.add("auty-v26-hide");
    calendarChildren.forEach((child) => child.classList.remove("auty-v26-hide"));
  });

  tabs.querySelector('[data-auty-reminder-tab="reminders"]')?.addEventListener("click", () => {
    tabs.querySelectorAll("button").forEach((button) => button.dataset.active = "false");
    tabs.querySelector('[data-auty-reminder-tab="reminders"]').dataset.active = "true";
    calendarChildren.forEach((child) => child.classList.add("auty-v26-hide"));
    reminderHost.classList.remove("auty-v26-hide");
    renderRemindersView(reminderHost);
  });
}

function libraryTone(text) {
  const lower = text.toLowerCase();
  if (lower.includes("overdue")) return "red";
  if (lower.includes("paid")) return "green";
  if (lower.includes("invoice")) return "amber";
  if (lower.includes("archive")) return "grey";
  return "blue";
}

function installInvoiceQuoteLibrary() {
  if (activeMainTitle() !== "Dashboard") return;
  if (document.querySelector(".auty-v26-quote-invoice-library")) return;
  const dashboardRoot = document.querySelector(".auty-v26-dashboard")?.parentElement;
  if (!dashboardRoot) return;

  const existingCards = Array.from(document.querySelectorAll("div"))
    .filter((node) => /AUTY-Q-|AUTY-I-|Awaiting Approval|Invoice/i.test(textOf(node)))
    .slice(0, 6);

  const panel = document.createElement("div");
  panel.className = "auty-v26-panel auty-v26-quote-invoice-library";
  panel.innerHTML = `
    <h3>Quotes & Invoices</h3>
    <div class="auty-v26-library">
      ${existingCards.length ? existingCards.map((card) => {
        const text = textOf(card).slice(0, 120);
        const tone = libraryTone(text);
        const isQuote = text.includes("AUTY-Q") || text.toLowerCase().includes("quote");
        return `<div class="auty-v26-library-card">
          <div class="auty-v26-card-title"><strong>${isQuote ? "Quote" : "Invoice"}</strong><span class="auty-v26-status" data-tone="${tone}">${isQuote ? "Blue" : tone === "green" ? "Paid" : tone === "red" ? "Overdue" : "Unpaid"}</span></div>
          <p class="auty-v26-muted">${text}</p>
          <div class="auty-v26-card-actions"><button type="button" data-lib-open="${isQuote ? "quote" : "invoice"}">Open</button><button type="button" data-lib-archive>Archive</button><button type="button" data-lib-paid>Mark paid</button></div>
        </div>`;
      }).join("") : `<p class="auty-v26-muted">Recent quotes and invoices will appear here when they exist.</p>`}
    </div>
  `;
  dashboardRoot.appendChild(panel);

  panel.querySelectorAll("[data-lib-open]").forEach((button) => {
    button.addEventListener("click", () => {
      clickNav("Current Job");
      setTimeout(() => clickJobTab(button.getAttribute("data-lib-open") === "invoice" ? "Invoice Generator" : "Job Overview"), 150);
    });
  });
  panel.querySelectorAll("[data-lib-archive]").forEach((button) => {
    button.addEventListener("click", () => button.closest(".auty-v26-library-card")?.remove());
  });
  panel.querySelectorAll("[data-lib-paid]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".auty-v26-library-card");
      const status = card?.querySelector(".auty-v26-status");
      if (status) {
        status.textContent = "Paid";
        status.dataset.tone = "green";
      }
    });
  });
}

function addPdfNotes() {
  if (!/Job Overview|Invoice Generator/.test(activeMainTitle())) return;
  if (document.querySelector(".auty-v26-pdf-note")) return;
  const button = Array.from(document.querySelectorAll("button"))
    .find((node) => /Generate Quote PDF|Generate Final Invoice/.test(textOf(node)));
  if (!button) return;
  const note = document.createElement("div");
  note.className = "auty-v26-pdf-note";
  note.textContent = "v2.6 note: PDFs now generate reliably. The next native pass will make room descriptions more client-friendly and remove duplicated whole-job text.";
  button.parentElement?.appendChild(note);
}

function run() {
  ensureStyle();
  ensureVersionBadge();
  renderDashboard();
  installCalendarReminderTabs();
  installInvoiceQuoteLibrary();
  addPdfNotes();
}

let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    run();
  });
}

window.__AUTY_VERSION__ = VERSION;
window.addEventListener("load", schedule);
window.setTimeout(schedule, 250);
window.setTimeout(schedule, 1200);
new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
