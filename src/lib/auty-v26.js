const REMINDER_KEY = "auty-v26-reminders";

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

function activeTitle() {
  return textOf(document.querySelector("header h1"));
}

function clickButton(label) {
  Array.from(document.querySelectorAll("button"))
    .find((button) => textOf(button) === label)
    ?.click();
}

function ensureStyle() {
  if (document.getElementById("auty-v26-combined-style")) return;
  const style = document.createElement("style");
  style.id = "auty-v26-combined-style";
  style.textContent = `
    html,
    body,
    #root {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }

    body {
      margin: 0 !important;
      background: linear-gradient(180deg, #d8e6e8, #c3d3d9 48%, #adbec7) !important;
    }

    #root > div.min-h-screen {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    #root > div.min-h-screen > div {
      width: 100% !important;
      max-width: 100vw !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      padding-left: max(.85rem, env(safe-area-inset-left)) !important;
      padding-right: max(.85rem, env(safe-area-inset-right)) !important;
      overflow-x: hidden !important;
      background: transparent !important;
      border-left: 0 !important;
      border-right: 0 !important;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box !important;
      max-width: 100%;
    }

    section,
    article,
    aside,
    header,
    nav,
    input,
    select,
    textarea,
    button,
    div {
      min-width: 0;
    }

    .auty-v25-badge,
    .auty-v26-badge,
    .auty-v26-pdf-note,
    .auty-hide-original,
    .auty-dashboard-hide-original {
      display: none !important;
    }

    header.auty-compact-header {
      position: relative !important;
      min-height: 5.65rem !important;
      height: 5.65rem !important;
      padding: .65rem 4rem .65rem 1rem !important;
      border-radius: 1.45rem !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: .65rem !important;
      background: linear-gradient(135deg, rgba(255,255,255,.78), rgba(255,255,255,.46)) !important;
      border: 1px solid rgba(255,255,255,.76) !important;
      box-shadow: 0 20px 48px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.88) !important;
      backdrop-filter: blur(28px) saturate(1.16) !important;
    }

    header.auty-compact-header img {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 7rem !important;
      height: 3rem !important;
      max-width: 42vw !important;
      object-fit: contain !important;
      border-radius: .5rem !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    header.auty-compact-header h1 {
      position: absolute !important;
      left: 1rem !important;
      bottom: .58rem !important;
      font-size: 1.04rem !important;
      line-height: 1.05 !important;
      margin: 0 !important;
      max-width: 35vw !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    header.auty-compact-header button {
      position: absolute !important;
      right: .9rem !important;
      top: .72rem !important;
      width: 2.45rem !important;
      height: 2.45rem !important;
      min-height: 2.45rem !important;
      border-radius: 999px !important;
      padding: 0 !important;
      z-index: 5 !important;
    }

    header.auty-compact-header button::after {
      content: "✓";
      position: absolute;
      left: 50%;
      top: calc(100% + .24rem);
      transform: translateX(-50%);
      width: 1.3rem;
      height: 1.3rem;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      border: 1px solid rgba(22,101,52,.20);
      font-size: .82rem;
      font-weight: 950;
      box-shadow: 0 6px 12px rgba(22,101,52,.12);
    }

    section,
    article,
    aside > div {
      background: linear-gradient(135deg, rgba(255,255,255,.54), rgba(255,255,255,.30)) !important;
      border: 1px solid rgba(255,255,255,.58) !important;
      box-shadow: 0 18px 42px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.68) !important;
      overflow: hidden !important;
      backdrop-filter: blur(20px) saturate(1.1) !important;
    }

    section section,
    article article,
    section article,
    label {
      box-shadow: none !important;
    }

    .auty-dashboard-panel,
    .auty-reminder-panel,
    .auty-client-library-panel {
      border-radius: 1.45rem;
      border: 1px solid rgba(255,255,255,.62);
      background: linear-gradient(135deg, rgba(255,255,255,.66), rgba(255,255,255,.34));
      box-shadow: 0 16px 38px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.76);
      padding: 1rem;
      color: #0f172a;
    }

    .auty-dashboard-grid,
    .auty-actions-grid,
    .auty-field-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .7rem;
    }

    .auty-kpi {
      border-radius: 1.1rem;
      background: rgba(255,255,255,.58);
      border: 1px solid rgba(255,255,255,.66);
      padding: .8rem;
    }

    .auty-kpi span {
      display: block;
      color: #64748b;
      font-size: .8rem;
      font-weight: 850;
    }

    .auty-kpi strong {
      display: block;
      margin-top: .2rem;
      color: #020617;
      font-size: 1.55rem;
      line-height: 1;
    }

    .auty-action-button,
    .auty-reminder-panel button {
      border: 0;
      border-radius: 1.05rem;
      min-height: 2.9rem;
      padding: .75rem .9rem;
      background: linear-gradient(135deg, #00b8c6, #12c7b8);
      color: #061019;
      font-weight: 950;
      box-shadow: 0 14px 30px rgba(0,184,198,.20), inset 0 1px 0 rgba(255,255,255,.36);
    }

    .auty-secondary-button {
      background: rgba(255,255,255,.50) !important;
      color: #0f172a !important;
      border: 1px solid rgba(255,255,255,.66) !important;
    }

    .auty-reminder-tabs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .4rem;
      margin: .75rem 0 1rem;
      padding: .25rem;
      border-radius: 999px;
      background: rgba(255,255,255,.48);
      border: 1px solid rgba(255,255,255,.66);
    }

    .auty-reminder-tabs button {
      border: 0;
      border-radius: 999px;
      padding: .68rem .85rem;
      background: transparent;
      color: #475569;
      font-weight: 900;
    }

    .auty-reminder-tabs button[data-active="true"] {
      background: linear-gradient(135deg, #00b8c6, #12c7b8);
      color: #061019;
    }

    .auty-field {
      display: grid;
      gap: .35rem;
    }

    .auty-field label {
      font-size: .72rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .1em;
    }

    .auty-field input,
    .auty-field select,
    .auty-field textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,.66);
      border-radius: .95rem;
      padding: .82rem .9rem;
      background: rgba(255,255,255,.58);
      color: #0f172a;
      outline: none;
    }

    .auty-card {
      border-radius: 1.1rem;
      background: rgba(255,255,255,.58);
      border: 1px solid rgba(255,255,255,.66);
      padding: .82rem;
      box-shadow: 0 10px 22px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.66);
    }

    .auty-status {
      display: inline-flex;
      border-radius: 999px;
      padding: .26rem .55rem;
      font-size: .7rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .auty-status[data-tone="blue"] { background: #dbeafe; color: #1d4ed8; }
    .auty-status[data-tone="amber"] { background: #fef3c7; color: #92400e; }
    .auty-status[data-tone="red"] { background: #fee2e2; color: #991b1b; }
    .auty-status[data-tone="green"] { background: #dcfce7; color: #166534; }
    .auty-status[data-tone="grey"] { background: #e2e8f0; color: #475569; }

    .auty-calendar-date-cell {
      overflow: hidden !important;
    }

    .auty-calendar-date-cell > div:first-child,
    .auty-calendar-date-cell > span:first-child,
    .auty-calendar-date-cell > button:first-child {
      width: 2rem !important;
      height: 2rem !important;
      min-width: 2rem !important;
      border-radius: 999px !important;
      display: grid !important;
      place-items: center !important;
      padding: 0 !important;
    }

    .auty-dashboard-no-library .auty-v26-quote-invoice-library {
      display: none !important;
    }

    .auty-job-totals-panel {
      background: linear-gradient(145deg, rgba(255,255,255,.84), rgba(230,244,247,.64)) !important;
      color: #0f172a !important;
      border-color: rgba(255,255,255,.72) !important;
    }

    .auty-job-totals-panel,
    .auty-job-totals-panel * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    .auty-total-row {
      background: rgba(255,255,255,.84) !important;
      border: 1px solid rgba(255,255,255,.70) !important;
      border-left: .42rem solid var(--auty-total-tone, #00b8c6) !important;
      box-shadow: 0 10px 22px rgba(15,23,42,.07), inset 0 1px 0 rgba(255,255,255,.72) !important;
    }

    .auty-total-row[data-tone="labour"] { --auty-total-tone: #2563eb; }
    .auty-total-row[data-tone="materials"] { --auty-total-tone: #f59e0b; }
    .auty-total-row[data-tone="discount"] { --auty-total-tone: #e11d48; }
    .auty-total-row[data-tone="vat"] { --auty-total-tone: #7c3aed; }
    .auty-total-row[data-tone="total"] { --auty-total-tone: #00b8c6; }
    .auty-total-row[data-tone="deposit"] { --auty-total-tone: #10b981; }
    .auty-total-row[data-tone="remainder"] { --auty-total-tone: #0f172a; }

    @media (max-width: 720px) {
      #root > div.min-h-screen > div {
        padding-left: .72rem !important;
        padding-right: .72rem !important;
      }

      header.auty-compact-header {
        min-height: 5.4rem !important;
        height: 5.4rem !important;
      }

      header.auty-compact-header img {
        width: 6.55rem !important;
        height: 2.75rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function hideHeaderText() {
  const header = document.querySelector("header");
  if (!header) return;
  header.classList.add("auty-compact-header");
  Array.from(header.querySelectorAll("p, span, div")).forEach((node) => {
    const text = textOf(node);
    if (/AUTY DECORATING WORKSPACE APP|@|Cloud synced|Preview mode|Loading workspace|Supabase|v2\./i.test(text)) {
      node.classList.add("auty-hide-original");
    }
  });
  Array.from(header.querySelectorAll(".auty-v25-badge, .auty-v26-badge")).forEach((node) => node.remove());
}

function countsFromDashboard() {
  const labels = ["Jobs", "Quotes", "Invoices", "Blocked"];
  const result = {};
  labels.forEach((label) => {
    const node = Array.from(document.querySelectorAll("p, span, div")).find((item) => textOf(item) === label);
    const card = node?.closest("div[class*='rounded']") || node?.parentElement;
    const numberText = Array.from(card?.querySelectorAll("p, strong, div") || []).map(textOf).find((text) => /^\d+$/.test(text));
    result[label] = Number(numberText || 0);
  });
  return result;
}

function renderDashboard() {
  const isDashboard = activeTitle() === "Dashboard";
  document.body.classList.toggle("auty-dashboard-no-library", isDashboard);
  if (!isDashboard) return;
  const todayLabel = Array.from(document.querySelectorAll("p, h2, h3")).find((node) => textOf(node) === "Today");
  const hero = todayLabel?.closest("section") || todayLabel?.parentElement;
  if (!hero || hero.querySelector(".auty-dashboard-panel")) return;
  Array.from(hero.children).forEach((child) => child.classList.add("auty-dashboard-hide-original"));

  const counts = countsFromDashboard();
  const reminders = readReminders().filter((item) => !item.archived);
  const dueToday = reminders.filter((item) => reminderStatus(item) === "Today").length;
  const overdue = reminders.filter((item) => reminderStatus(item) === "Overdue").length;

  const dashboard = document.createElement("div");
  dashboard.className = "auty-dashboard-panel";
  dashboard.innerHTML = `
    <h3>Today</h3>
    <div class="auty-dashboard-grid">
      <div class="auty-kpi"><span>Active jobs</span><strong>${counts.Jobs || 0}</strong></div>
      <div class="auty-kpi"><span>Quotes awaiting</span><strong>${counts.Quotes || 0}</strong></div>
      <div class="auty-kpi"><span>Invoices open</span><strong>${counts.Invoices || 0}</strong></div>
      <div class="auty-kpi"><span>Blocked dates</span><strong>${counts.Blocked || 0}</strong></div>
      <div class="auty-kpi"><span>Reminders today</span><strong>${dueToday}</strong></div>
      <div class="auty-kpi"><span>Overdue</span><strong>${overdue}</strong></div>
    </div>
    <div class="auty-actions-grid" style="margin-top:.8rem">
      <button class="auty-action-button" type="button" data-open-current>Open Current Job</button>
      <button class="auty-action-button auty-secondary-button" type="button" data-open-calendar>Calendar / Directions</button>
      <button class="auty-action-button" type="button" data-open-reminders>Open Reminders</button>
      <button class="auty-action-button auty-secondary-button" type="button" data-new-quote>New Quote</button>
    </div>
  `;
  hero.appendChild(dashboard);
  dashboard.querySelector("[data-open-current]")?.addEventListener("click", () => clickButton("Current Job"));
  dashboard.querySelector("[data-open-calendar]")?.addEventListener("click", () => clickButton("Calendar"));
  dashboard.querySelector("[data-new-quote]")?.addEventListener("click", () => {
    clickButton("Current Job");
    setTimeout(() => clickButton("Room Quoter"), 120);
  });
  dashboard.querySelector("[data-open-reminders]")?.addEventListener("click", () => {
    clickButton("Calendar");
    setTimeout(() => document.querySelector('[data-auty-reminder-tab="reminders"]')?.click(), 250);
  });
}

function reminderCard(item) {
  const status = reminderStatus(item);
  const tone = status === "Overdue" ? "red" : status === "Today" ? "amber" : status === "Complete" ? "green" : "blue";
  return `
    <div class="auty-card" data-reminder-id="${item.id}">
      <div style="display:flex;justify-content:space-between;gap:.6rem;align-items:flex-start">
        <div><strong>${item.title || "Untitled reminder"}</strong><p style="margin:.2rem 0 0;color:#64748b">${item.dueDate || "No due date"}${item.linkedTo ? ` · ${item.linkedTo}` : ""}</p></div>
        <span class="auty-status" data-tone="${tone}">${status}</span>
      </div>
      ${item.notes ? `<p style="color:#64748b">${item.notes}</p>` : ""}
      <div style="display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.6rem">
        <button type="button" data-reminder-complete="${item.id}">${item.completed ? "Reopen" : "Done"}</button>
        <button type="button" data-reminder-archive="${item.id}">Archive</button>
        <button type="button" data-reminder-delete="${item.id}">Delete</button>
      </div>
    </div>`;
}

function renderReminders(container) {
  const reminders = readReminders();
  const active = reminders.filter((item) => !item.archived);
  const archived = reminders.filter((item) => item.archived);
  container.innerHTML = `
    <div class="auty-reminder-panel">
      <h3>Add Reminder</h3>
      <div class="auty-field-grid">
        <div class="auty-field"><label>Title</label><input data-reminder-title placeholder="Call client / Chase quote / Buy materials"></div>
        <div class="auty-field"><label>Due date</label><input data-reminder-date type="date" value="${todayStamp()}"></div>
        <div class="auty-field"><label>Priority</label><select data-reminder-priority><option>Normal</option><option>Urgent</option><option>Low</option></select></div>
        <div class="auty-field"><label>Linked to</label><input data-reminder-link placeholder="Client, quote or job reference"></div>
      </div>
      <div class="auty-field" style="margin-top:.7rem"><label>Notes</label><textarea data-reminder-notes rows="3"></textarea></div>
      <div class="auty-actions-grid" style="margin-top:.8rem"><button type="button" data-reminder-save>Save Reminder</button></div>
    </div>
    <div class="auty-reminder-panel" style="margin-top:.85rem"><h3>Active Reminders</h3><div style="display:grid;gap:.7rem">${active.length ? active.map(reminderCard).join("") : `<p style="color:#64748b">No active reminders.</p>`}</div></div>
    <div class="auty-reminder-panel" style="margin-top:.85rem"><h3>Archive</h3><div style="display:grid;gap:.7rem">${archived.length ? archived.map(reminderCard).join("") : `<p style="color:#64748b">No archived reminders.</p>`}</div></div>`;

  container.querySelector("[data-reminder-save]")?.addEventListener("click", () => {
    const title = container.querySelector("[data-reminder-title]")?.value?.trim();
    if (!title) return alert("Add a reminder title.");
    saveReminders([{ id: `rem-${crypto.randomUUID()}`, title, dueDate: container.querySelector("[data-reminder-date]")?.value || todayStamp(), priority: container.querySelector("[data-reminder-priority]")?.value || "Normal", linkedTo: container.querySelector("[data-reminder-link]")?.value?.trim() || "", notes: container.querySelector("[data-reminder-notes]")?.value?.trim() || "", completed: false, archived: false, createdAt: new Date().toISOString() }, ...readReminders()]);
    renderReminders(container);
  });
  container.querySelectorAll("[data-reminder-complete]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.reminderComplete; saveReminders(readReminders().map((item) => item.id === id ? { ...item, completed: !item.completed } : item)); renderReminders(container); }));
  container.querySelectorAll("[data-reminder-archive]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.reminderArchive; saveReminders(readReminders().map((item) => item.id === id ? { ...item, archived: true } : item)); renderReminders(container); }));
  container.querySelectorAll("[data-reminder-delete]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.reminderDelete; saveReminders(readReminders().filter((item) => item.id !== id)); renderReminders(container); }));
}

function installCalendarReminders() {
  if (activeTitle() !== "Calendar") return;
  const label = Array.from(document.querySelectorAll("p, h2, h3")).find((node) => /Business Calendar/i.test(textOf(node)));
  const section = label?.closest("section");
  if (!section || section.querySelector(".auty-reminder-tabs")) return;

  const tabs = document.createElement("div");
  tabs.className = "auty-reminder-tabs";
  tabs.innerHTML = `<button type="button" data-auty-reminder-tab="calendar" data-active="true">Calendar</button><button type="button" data-auty-reminder-tab="reminders">Reminders</button>`;
  section.insertBefore(tabs, section.children[1] || null);

  const reminderHost = document.createElement("div");
  reminderHost.className = "auty-reminder-host auty-hide-original";
  section.appendChild(reminderHost);
  renderReminders(reminderHost);
  const calendarChildren = Array.from(section.children).filter((child) => child !== tabs && child !== reminderHost && !child.contains(label));

  tabs.querySelector('[data-auty-reminder-tab="calendar"]')?.addEventListener("click", () => {
    tabs.querySelectorAll("button").forEach((button) => button.dataset.active = "false");
    tabs.querySelector('[data-auty-reminder-tab="calendar"]').dataset.active = "true";
    reminderHost.classList.add("auty-hide-original");
    calendarChildren.forEach((child) => child.classList.remove("auty-hide-original"));
  });
  tabs.querySelector('[data-auty-reminder-tab="reminders"]')?.addEventListener("click", () => {
    tabs.querySelectorAll("button").forEach((button) => button.dataset.active = "false");
    tabs.querySelector('[data-auty-reminder-tab="reminders"]').dataset.active = "true";
    calendarChildren.forEach((child) => child.classList.add("auty-hide-original"));
    reminderHost.classList.remove("auty-hide-original");
    renderReminders(reminderHost);
  });

  const grid = Array.from(section.querySelectorAll(".grid.grid-cols-7")).find((node) => node.children.length >= 28);
  if (grid) Array.from(grid.children).forEach((cell) => cell.classList.add("auty-calendar-date-cell"));
}

function installClientLibrary() {
  const existingDashboardLibrary = document.querySelector(".auty-v26-quote-invoice-library");
  if (activeTitle() === "Dashboard" && existingDashboardLibrary) existingDashboardLibrary.remove();
  if (activeTitle() !== "Client Database") return;
  if (document.querySelector(".auty-client-library-panel")) return;

  const anchor = Array.from(document.querySelectorAll("section, article")).at(-1) || document.body;
  const panel = document.createElement("section");
  panel.className = "auty-client-library-panel";
  panel.innerHTML = `
    <h3>Quotes & Invoices</h3>
    <div style="display:grid;gap:.7rem">
      <div class="auty-card"><div style="display:flex;justify-content:space-between;gap:.6rem"><strong>Recent quotes</strong><span class="auty-status" data-tone="blue">Quotes</span></div><p style="color:#64748b">Quote records are grouped with client information here.</p><button class="auty-action-button" type="button" data-open-job-overview>Open quotes</button></div>
      <div class="auty-card"><div style="display:flex;justify-content:space-between;gap:.6rem"><strong>Invoice library</strong><span class="auty-status" data-tone="amber">Unpaid</span></div><p style="color:#64748b">Invoices now live in Client Database instead of Dashboard.</p><div style="display:flex;gap:.45rem;flex-wrap:wrap"><button class="auty-action-button" type="button" data-open-invoices>Open invoices</button><button class="auty-action-button auty-secondary-button" type="button" data-mark-paid>Mark paid</button><button class="auty-action-button auty-secondary-button" type="button" data-archive-card>Archive</button></div></div>
    </div>`;
  anchor.after(panel);
  panel.querySelector("[data-open-job-overview]")?.addEventListener("click", () => { clickButton("Current Job"); setTimeout(() => clickButton("Job Overview"), 120); });
  panel.querySelector("[data-open-invoices]")?.addEventListener("click", () => { clickButton("Current Job"); setTimeout(() => clickButton("Invoice Generator"), 120); });
  panel.querySelector("[data-mark-paid]")?.addEventListener("click", (event) => { const status = event.currentTarget.closest(".auty-card")?.querySelector(".auty-status"); if (status) { status.textContent = "Paid"; status.dataset.tone = "green"; } });
  panel.querySelector("[data-archive-card]")?.addEventListener("click", (event) => event.currentTarget.closest(".auty-card")?.remove());
}

function toneForRow(text) {
  const lower = text.toLowerCase();
  if (lower.includes("labour")) return "labour";
  if (lower.includes("materials")) return "materials";
  if (lower.includes("discount")) return "discount";
  if (lower.includes("vat")) return "vat";
  if (lower.includes("deposit")) return "deposit";
  if (lower.includes("remainder")) return "remainder";
  return "total";
}

function improveJobOverview() {
  if (activeTitle() !== "Job Overview") return;
  const heading = Array.from(document.querySelectorAll("h2, h3")).find((node) => /Job Totals/i.test(textOf(node)));
  const panel = heading?.closest("section") || heading?.parentElement;
  if (!panel) return;
  panel.classList.add("auty-job-totals-panel");
  Array.from(panel.querySelectorAll("div")).forEach((node) => {
    const text = textOf(node);
    const looksLikeRow = /£/.test(text) && /(Labour|Materials|Subtotal|Discount|VAT|Job total|Deposit|Remainder)/i.test(text) && text.length < 90;
    if (!looksLikeRow) return;
    node.classList.add("auty-total-row");
    node.dataset.tone = toneForRow(text);
  });
}

function run() {
  ensureStyle();
  hideHeaderText();
  renderDashboard();
  installCalendarReminders();
  installClientLibrary();
  improveJobOverview();
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

window.addEventListener("load", schedule);
window.setTimeout(schedule, 200);
window.setTimeout(schedule, 900);
new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
