function textOf(node) {
  return node?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function ensureJobOverviewContrastStyle() {
  if (document.getElementById("auty-job-overview-contrast-fix")) return;
  const style = document.createElement("style");
  style.id = "auty-job-overview-contrast-fix";
  style.textContent = `
    .auty-job-contrast-panel {
      background: linear-gradient(145deg, rgba(255,255,255,.92), rgba(232,247,249,.78)) !important;
      border: 1px solid rgba(255,255,255,.82) !important;
      box-shadow: 0 18px 42px rgba(15,23,42,.13), inset 0 1px 0 rgba(255,255,255,.86) !important;
      color: #0f172a !important;
    }

    .auty-job-contrast-panel,
    .auty-job-contrast-panel * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    .auty-job-contrast-panel h2,
    .auty-job-contrast-panel h3 {
      color: #0f172a !important;
      opacity: 1 !important;
    }

    .auty-job-contrast-row {
      background: rgba(255,255,255,.90) !important;
      border: 1px solid rgba(255,255,255,.78) !important;
      border-left: .45rem solid var(--auty-job-tone, #00b8c6) !important;
      box-shadow: 0 10px 24px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.86) !important;
      color: #0f172a !important;
      opacity: 1 !important;
    }

    .auty-job-contrast-row * {
      color: #0f172a !important;
      opacity: 1 !important;
    }

    .auty-job-contrast-row[data-tone="labour"] { --auty-job-tone: #2563eb; }
    .auty-job-contrast-row[data-tone="materials"] { --auty-job-tone: #f59e0b; }
    .auty-job-contrast-row[data-tone="discount"] { --auty-job-tone: #e11d48; }
    .auty-job-contrast-row[data-tone="vat"] { --auty-job-tone: #7c3aed; }
    .auty-job-contrast-row[data-tone="total"] { --auty-job-tone: #00b8c6; }
    .auty-job-contrast-row[data-tone="deposit"] { --auty-job-tone: #10b981; }
    .auty-job-contrast-row[data-tone="remainder"] { --auty-job-tone: #0f172a; }
  `;
  document.head.appendChild(style);
}

function toneFor(text) {
  const lower = text.toLowerCase();
  if (lower.includes("labour")) return "labour";
  if (lower.includes("materials")) return "materials";
  if (lower.includes("discount")) return "discount";
  if (lower.includes("vat")) return "vat";
  if (lower.includes("deposit")) return "deposit";
  if (lower.includes("remainder")) return "remainder";
  return "total";
}

function fixJobOverviewContrast() {
  ensureJobOverviewContrastStyle();

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
  const jobTotalsHeading = headings.find((node) => /Job Totals/i.test(textOf(node)));
  if (!jobTotalsHeading) return;

  const panel = jobTotalsHeading.closest("section") || jobTotalsHeading.closest("article") || jobTotalsHeading.parentElement;
  if (!panel) return;
  panel.classList.add("auty-job-contrast-panel");

  Array.from(panel.querySelectorAll("div, p, li")).forEach((node) => {
    const text = textOf(node);
    const isMoneyRow = /£/.test(text) && /(Labour|Materials|Subtotal|Discount|VAT|Job total|Deposit|Remainder)/i.test(text) && text.length < 100;
    if (!isMoneyRow) return;
    node.classList.add("auty-job-contrast-row");
    node.dataset.tone = toneFor(text);
  });
}

let scheduled = false;
function scheduleJobOverviewContrastFix() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    fixJobOverviewContrast();
  });
}

window.addEventListener("load", scheduleJobOverviewContrastFix);
window.setTimeout(scheduleJobOverviewContrastFix, 200);
window.setTimeout(scheduleJobOverviewContrastFix, 900);
new MutationObserver(scheduleJobOverviewContrastFix).observe(document.documentElement, { childList: true, subtree: true });
