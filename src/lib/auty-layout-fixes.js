const LAYOUT_VERSION = "layout-fixes-20260608";

function textOf(node) {
  return node?.textContent?.replace(/\s+/g, " ").trim() || "";
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
  if (document.getElementById("auty-layout-fixes-style")) return;
  const style = document.createElement("style");
  style.id = "auty-layout-fixes-style";
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

    section::before,
    section::after,
    article::before,
    article::after,
    header::before,
    header::after {
      border-radius: inherit !important;
    }

    .auty-v25-badge,
    .auty-v26-badge,
    .auty-v27-remove,
    .auty-v26-pdf-note {
      display: none !important;
    }

    header.auty-compact-header {
      position: relative !important;
      min-height: 6rem !important;
      height: 6rem !important;
      padding: .7rem 4.15rem .7rem 1rem !important;
      border-radius: 1.55rem !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: .65rem !important;
    }

    header.auty-compact-header .auty-hide-header-text {
      display: none !important;
    }

    header.auty-compact-header img {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 7.25rem !important;
      height: 3.1rem !important;
      max-width: 42vw !important;
      object-fit: contain !important;
      border-radius: .55rem !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    header.auty-compact-header h1 {
      position: absolute !important;
      left: 1rem !important;
      bottom: .66rem !important;
      font-size: 1.05rem !important;
      line-height: 1.05 !important;
      margin: 0 !important;
      max-width: 32vw !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    header.auty-compact-header button {
      position: absolute !important;
      right: .9rem !important;
      top: .8rem !important;
      width: 2.55rem !important;
      height: 2.55rem !important;
      min-height: 2.55rem !important;
      border-radius: 999px !important;
      padding: 0 !important;
      z-index: 5 !important;
    }

    header.auty-compact-header button::after {
      content: "✓";
      position: absolute;
      left: 50%;
      top: calc(100% + .28rem);
      transform: translateX(-50%);
      width: 1.35rem;
      height: 1.35rem;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      border: 1px solid rgba(22,101,52,.20);
      font-size: .86rem;
      font-weight: 950;
      box-shadow: 0 6px 12px rgba(22,101,52,.12);
    }

    header.auty-compact-header [class*="Cloud"],
    header.auty-compact-header [class*="Preview"],
    header.auty-compact-header [class*="workspace"],
    header.auty-compact-header p,
    header.auty-compact-header span:not(.auty-keep-status-icon) {
      font-size: 0 !important;
      color: transparent !important;
    }

    header.auty-compact-header p:has(+ h1),
    header.auty-compact-header p:has(~ h1) {
      display: none !important;
    }

    .auty-simplify-layers section,
    .auty-simplify-layers article,
    .auty-simplify-layers aside > div {
      background: linear-gradient(135deg, rgba(255,255,255,.54), rgba(255,255,255,.30)) !important;
      border: 1px solid rgba(255,255,255,.58) !important;
      box-shadow: 0 18px 42px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.68) !important;
      overflow: hidden !important;
    }

    .auty-simplify-layers section section,
    .auty-simplify-layers article article,
    .auty-simplify-layers section article,
    .auty-simplify-layers label {
      box-shadow: none !important;
    }

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

    .auty-calendar-date-cell [class*="rounded-full"] {
      border-radius: 999px !important;
    }

    .auty-client-library-panel {
      margin-top: 1rem !important;
    }

    .auty-dashboard-no-library .auty-v26-quote-invoice-library {
      display: none !important;
    }

    .auty-job-overview-readable section,
    .auty-job-overview-readable article {
      color: #0f172a !important;
    }

    .auty-job-totals-panel {
      background: linear-gradient(145deg, rgba(255,255,255,.82), rgba(230,244,247,.62)) !important;
      color: #0f172a !important;
      border-color: rgba(255,255,255,.72) !important;
    }

    .auty-job-totals-panel,
    .auty-job-totals-panel * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    .auty-total-row {
      background: rgba(255,255,255,.82) !important;
      border: 1px solid rgba(255,255,255,.68) !important;
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

    .auty-total-row strong,
    .auty-total-row p,
    .auty-total-row span,
    .auty-total-row div {
      color: #0f172a !important;
    }

    @media (max-width: 720px) {
      #root > div.min-h-screen > div {
        padding-left: .72rem !important;
        padding-right: .72rem !important;
      }

      header.auty-compact-header {
        min-height: 5.65rem !important;
        height: 5.65rem !important;
        border-radius: 1.35rem !important;
      }

      header.auty-compact-header img {
        width: 6.7rem !important;
        height: 2.85rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function compactHeader() {
  const header = document.querySelector("header");
  if (!header) return;
  header.classList.add("auty-compact-header");

  Array.from(header.querySelectorAll("p, span, div")).forEach((node) => {
    const text = textOf(node);
    if (/AUTY DECORATING WORKSPACE APP|@|Cloud synced|Preview mode|Loading workspace|Supabase|v2\./i.test(text)) {
      node.classList.add("auty-hide-header-text");
    }
  });

  Array.from(header.querySelectorAll(".auty-v25-badge, .auty-v26-badge, .auty-v27-badge")).forEach((node) => node.remove());
}

function simplifyLayers() {
  document.body.classList.add("auty-simplify-layers");
  if (activeTitle() === "Dashboard") document.body.classList.add("auty-dashboard-no-library");
  else document.body.classList.remove("auty-dashboard-no-library");
}

function markCalendarDates() {
  if (activeTitle() !== "Calendar") return;
  const label = Array.from(document.querySelectorAll("p, h2, h3")).find((node) => /Business Calendar/i.test(textOf(node)));
  const section = label?.closest("section");
  const grid = section ? Array.from(section.querySelectorAll(".grid.grid-cols-7")).find((node) => node.children.length >= 28) : null;
  if (!grid) return;
  Array.from(grid.children).forEach((cell) => cell.classList.add("auty-calendar-date-cell"));
}

function toneForRow(text) {
  const lower = text.toLowerCase();
  if (lower.includes("labour")) return "labour";
  if (lower.includes("materials")) return "materials";
  if (lower.includes("discount")) return "discount";
  if (lower.includes("vat")) return "vat";
  if (lower.includes("job total") || lower.includes("subtotal")) return "total";
  if (lower.includes("deposit")) return "deposit";
  if (lower.includes("remainder")) return "remainder";
  return "total";
}

function improveJobOverview() {
  const isJobOverview = activeTitle() === "Job Overview";
  document.body.classList.toggle("auty-job-overview-readable", isJobOverview);
  if (!isJobOverview) return;

  const heading = Array.from(document.querySelectorAll("h2, h3"))
    .find((node) => /Job Totals/i.test(textOf(node)));
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

function clientDatabaseLibrary() {
  const existingDashboardLibrary = document.querySelector(".auty-v26-quote-invoice-library");
  if (activeTitle() === "Dashboard" && existingDashboardLibrary) existingDashboardLibrary.remove();

  if (activeTitle() !== "Client Database") return;
  if (document.querySelector(".auty-client-library-panel")) return;

  const anchor = Array.from(document.querySelectorAll("section, article")).at(-1) || document.querySelector("main") || document.body;
  const panel = document.createElement("section");
  panel.className = "auty-v26-panel auty-client-library-panel";
  panel.innerHTML = `
    <h3>Quotes & Invoices</h3>
    <div class="auty-v26-library">
      <div class="auty-v26-library-card">
        <div class="auty-v26-card-title">
          <strong>Recent quotes</strong>
          <span class="auty-v26-status" data-tone="blue">Quotes</span>
        </div>
        <p class="auty-v26-muted">Open the current quote/job workspace from here. Quote records remain linked to clients.</p>
        <div class="auty-v26-card-actions"><button type="button" data-open-job-overview>Open quotes</button></div>
      </div>
      <div class="auty-v26-library-card">
        <div class="auty-v26-card-title">
          <strong>Invoice library</strong>
          <span class="auty-v26-status" data-tone="amber">Unpaid</span>
        </div>
        <p class="auty-v26-muted">Invoices now live with the client database area rather than the Dashboard.</p>
        <div class="auty-v26-card-actions"><button type="button" data-open-invoices>Open invoices</button><button type="button" data-mark-paid>Mark paid</button><button type="button" data-archive-card>Archive</button></div>
      </div>
    </div>
  `;
  anchor.after(panel);
  panel.querySelector("[data-open-job-overview]")?.addEventListener("click", () => {
    clickButton("Current Job");
    setTimeout(() => clickButton("Job Overview"), 120);
  });
  panel.querySelector("[data-open-invoices]")?.addEventListener("click", () => {
    clickButton("Current Job");
    setTimeout(() => clickButton("Invoice Generator"), 120);
  });
  panel.querySelector("[data-mark-paid]")?.addEventListener("click", (event) => {
    const status = event.currentTarget.closest(".auty-v26-library-card")?.querySelector(".auty-v26-status");
    if (status) {
      status.textContent = "Paid";
      status.dataset.tone = "green";
    }
  });
  panel.querySelector("[data-archive-card]")?.addEventListener("click", (event) => {
    event.currentTarget.closest(".auty-v26-library-card")?.remove();
  });
}

function run() {
  ensureStyle();
  compactHeader();
  simplifyLayers();
  markCalendarDates();
  improveJobOverview();
  clientDatabaseLibrary();
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

window.__AUTY_LAYOUT_FIXES__ = LAYOUT_VERSION;
window.addEventListener("load", schedule);
window.setTimeout(schedule, 200);
window.setTimeout(schedule, 900);
new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
