import { ADJUSTMENT_OPTIONS, DAY_RATE, LEGACY_KEYS, OTHER_FEATURE_KEYS, STORAGE_KEY, TIME_OPTIONS, initialState } from "./constants.js";

installCalendarPolish();

export const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = (value) => `£${number(value).toFixed(2)}`;
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
export const slug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const classNames = (...parts) => parts.filter(Boolean).join(" ");
export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const shortDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
export const monthStamp = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function installCalendarPolish() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__AUTY_CALENDAR_POLISH_INSTALLED__) return;
  window.__AUTY_CALENDAR_POLISH_INSTALLED__ = true;

  const style = document.createElement("style");
  style.id = "auty-calendar-polish";
  style.textContent = `
    body {
      background: linear-gradient(180deg, #d9e6e8 0%, #c9d8de 48%, #acbdc6 100%) !important;
    }

    #root > div.min-h-screen {
      background: radial-gradient(circle at top left, rgba(0,184,198,.18), transparent 24%), radial-gradient(circle at 82% 12%, rgba(212,175,55,.13), transparent 22%), linear-gradient(180deg, #dce8eb 0%, #c9d8de 54%, #b3c4cc 100%) !important;
    }

    header,
    section,
    article,
    aside > div {
      box-shadow: 0 22px 58px rgba(15, 23, 42, .12), inset 0 1px 0 rgba(255,255,255,.78) !important;
    }

    button[class*="#d4af37"][class*="#00b8c6"],
    .auty-teal-action {
      background: linear-gradient(135deg, #00b8c6 0%, #10c8ba 100%) !important;
      color: #061019 !important;
      box-shadow: 0 16px 36px rgba(0, 184, 198, .28), inset 0 1px 0 rgba(255,255,255,.35) !important;
    }

    button[class*="#d4af37"][class*="#00b8c6"]:hover,
    .auty-teal-action:hover {
      filter: saturate(1.08) brightness(1.02) !important;
    }

    .auty-select-card {
      display: grid !important;
      place-items: center !important;
      min-height: 6.8rem !important;
      text-align: center !important;
      gap: .55rem !important;
      box-shadow: 0 16px 34px rgba(15,23,42,.08), 0 0 0 1px rgba(255,255,255,.64), 0 0 26px rgba(0,184,198,.08) !important;
    }

    .auty-select-card:hover,
    .auty-select-card[class*="border-slate-900"] {
      transform: translateY(-2px) !important;
      box-shadow: 0 20px 42px rgba(15,23,42,.12), 0 0 30px rgba(0,184,198,.22), inset 0 1px 0 rgba(255,255,255,.72) !important;
    }

    .auty-select-card svg {
      margin: 0 auto !important;
    }

    .auty-choice {
      min-width: 4.35rem !important;
      border: 1px solid rgba(255,255,255,.7) !important;
      backdrop-filter: blur(16px) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 9px 22px rgba(15,23,42,.08) !important;
    }

    .auty-choice-yes {
      background: linear-gradient(135deg, rgba(16,185,129,.20), rgba(255,255,255,.55)) !important;
      color: #047857 !important;
    }

    .auty-choice-partial {
      background: linear-gradient(135deg, rgba(245,158,11,.24), rgba(255,255,255,.55)) !important;
      color: #92400e !important;
    }

    .auty-choice-no {
      background: linear-gradient(135deg, rgba(226,232,240,.74), rgba(255,255,255,.48)) !important;
      color: #334155 !important;
    }

    .auty-choice[class*="bg-slate-900"] {
      color: #061019 !important;
      transform: translateY(-1px) !important;
    }

    .auty-choice-yes[class*="bg-slate-900"] {
      background: linear-gradient(135deg, #22c55e, #10b981) !important;
    }

    .auty-choice-partial[class*="bg-slate-900"] {
      background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
    }

    .auty-choice-no[class*="bg-slate-900"] {
      background: linear-gradient(135deg, #0f172a, #1e293b) !important;
      color: #ffffff !important;
    }

    .auty-dashboard-copy {
      font-size: .95rem !important;
      line-height: 1.55 !important;
    }

    .auty-dashboard-copy::before {
      content: "Today: open Current Job for the live overview. Next job: check Calendar for upcoming work and directions.";
      display: block;
    }

    .auty-dashboard-copy {
      font-size: 0 !important;
    }

    .auty-dashboard-copy::before {
      font-size: .95rem !important;
    }

    .auty-calendar-page {
      display: block !important;
    }

    .auty-calendar-page > section {
      margin-bottom: 1rem !important;
    }

    .auty-calendar-page > aside {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    .auty-calendar-page > aside > div:first-child {
      order: 2 !important;
    }

    .auty-calendar-page > aside > div:nth-child(2) {
      order: 1 !important;
    }

    .auty-calendar-page [data-auty-calendar-grid="true"] {
      gap: .45rem !important;
    }

    .auty-calendar-page [data-auty-calendar-grid="true"] > div {
      min-height: 9.5rem !important;
      overflow: visible !important;
      padding: .75rem !important;
      border-radius: 1.35rem !important;
    }

    .auty-calendar-page [data-auty-calendar-events="true"] {
      display: grid !important;
      grid-auto-rows: 1.2rem !important;
      align-content: start !important;
      gap: .3rem !important;
      margin-top: 1rem !important;
      overflow: visible !important;
    }

    .auty-calendar-page [data-auty-calendar-events="true"] > button[title] {
      display: block !important;
      width: calc(100% + .9rem) !important;
      height: 1.15rem !important;
      min-height: 1.15rem !important;
      margin-left: -.45rem !important;
      margin-right: -.45rem !important;
      border-radius: 999px !important;
      overflow: hidden !important;
      transform: none !important;
      box-shadow: 0 .55rem 1.3rem rgba(15, 23, 42, .13) !important;
    }

    .auty-calendar-page [data-auty-calendar-events="true"] > button[title]:hover {
      transform: translateY(-1px) !important;
      z-index: 25 !important;
    }

    .auty-calendar-page [data-auty-calendar-events="true"] > button[title]::after {
      content: attr(title);
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      padding: 0 .55rem;
      color: rgba(15, 23, 42, .88);
      font-size: .58rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 0 rgba(255,255,255,.38);
    }

    .auty-calendar-page [data-auty-calendar-events="true"] > button[title] > div {
      top: 1.45rem !important;
    }

    .auty-calendar-page [data-auty-calendar-events="true"] > p {
      align-self: center;
      margin-top: .1rem;
    }

    @media (min-width: 740px) {
      .auty-other-features-panel > div:last-child,
      .auty-other-features-panel .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (min-width: 1024px) {
      .auty-calendar-page [data-auty-calendar-grid="true"] > div {
        min-height: 10.9rem !important;
      }
    }

    @media (max-width: 720px) {
      header {
        margin-top: .15rem !important;
      }

      .auty-calendar-page > section {
        padding: .9rem !important;
      }

      .auty-calendar-page [data-auty-calendar-grid="true"] {
        gap: .28rem !important;
      }

      .auty-calendar-page [data-auty-calendar-grid="true"] > div {
        min-height: 5.9rem !important;
        padding: .42rem !important;
        border-radius: 1rem !important;
      }

      .auty-calendar-page [data-auty-calendar-events="true"] {
        margin-top: .55rem !important;
        grid-auto-rows: .7rem !important;
        gap: .16rem !important;
      }

      .auty-calendar-page [data-auty-calendar-events="true"] > button[title] {
        height: .68rem !important;
        min-height: .68rem !important;
        width: calc(100% + .45rem) !important;
        margin-left: -.225rem !important;
        margin-right: -.225rem !important;
      }

      .auty-calendar-page [data-auty-calendar-events="true"] > button[title]::after {
        content: "";
        padding: 0;
      }
    }
  `;

  document.head.appendChild(style);

  let scheduled = false;
  const markCalendar = () => {
    scheduled = false;

    Array.from(document.querySelectorAll("button")).forEach((button) => {
      const text = button.textContent?.trim();
      if (["Yes", "No", "Partial"].includes(text)) {
        button.classList.add("auty-choice", `auty-choice-${text.toLowerCase()}`);
      }

      const hasCardShape = button.className?.toString().includes("rounded-[24px]") && button.querySelector("svg") && button.querySelector("p");
      if (hasCardShape) button.classList.add("auty-select-card");

      const isPrimaryAction = button.className?.toString().includes("#d4af37") && button.className?.toString().includes("#00b8c6");
      if (isPrimaryAction) button.classList.add("auty-teal-action");
    });

    const dashboardCopy = Array.from(document.querySelectorAll("p"))
      .find((node) => node.textContent?.startsWith("Dashboard, Calendar, Client Database"));
    if (dashboardCopy) dashboardCopy.classList.add("auty-dashboard-copy");

    const otherFeaturesHeading = Array.from(document.querySelectorAll("h2, h3"))
      .find((node) => node.textContent?.trim() === "Other Features");
    const otherPanel = otherFeaturesHeading?.closest("section") || otherFeaturesHeading?.parentElement;
    if (otherPanel) otherPanel.classList.add("auty-other-features-panel");

    const label = Array.from(document.querySelectorAll("p"))
      .find((node) => node.textContent?.trim() === "Business Calendar");
    const calendarSection = label?.closest("section");
    const page = calendarSection?.parentElement;
    if (!calendarSection || !page) return;

    page.classList.add("auty-calendar-page");

    const dayGrid = Array.from(calendarSection.querySelectorAll(".grid.grid-cols-7.gap-2"))
      .find((grid) => grid.querySelector("button[title]"));
    if (!dayGrid) return;

    dayGrid.setAttribute("data-auty-calendar-grid", "true");
    Array.from(dayGrid.children).forEach((cell) => {
      const eventTray = Array.from(cell.children)
        .find((child) => child.querySelector?.("button[title]"));
      if (eventTray) eventTray.setAttribute("data-auty-calendar-events", "true");
    });
  };

  const scheduleMark = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(markCalendar);
  };

  window.addEventListener("load", scheduleMark);
  window.setTimeout(scheduleMark, 250);
  window.setTimeout(scheduleMark, 1200);

  const observer = new MutationObserver(scheduleMark);
  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) startObserver();
  else document.addEventListener("DOMContentLoaded", startObserver, { once: true });
}

export function addDays(date, days) {
  if (!date) return "";
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + Math.max(0, Math.ceil(number(days)) - 1));
  return next.toISOString().slice(0, 10);
}

export function splitName(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return { surname: "", givenName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { surname: parts[0], givenName: "" };
  return { surname: parts[parts.length - 1], givenName: parts.slice(0, -1).join(" ") };
}

export function displayName(client) {
  const surname = client?.surname || "";
  const givenName = client?.givenName || "";
  if (surname || givenName) return [givenName, surname].filter(Boolean).join(" ").trim();
  return client?.name || "New Client";
}

export function databaseName(client) {
  const surname = client?.surname || "";
  const givenName = client?.givenName || "";
  if (surname || givenName) return `${surname || "Unknown"}, ${givenName}`.replace(/,\s$/, "");
  return client?.name || "Unknown";
}

export function factorFromLegacy(label) {
  if (label === "+5%") return 1.05;
  if (label === "+10%") return 1.1;
  if (label === "+15%") return 1.15;
  if (label === "+20%") return 1.2;
  if (label === "+30%") return 1.3;
  return 1;
}

export function roomNameFromDraft(room) {
  if (room.roomPreset !== "Other") return room.roomPreset;
  return room.roomOther || "Other";
}

export function adjustmentLabel(factor) {
  const match = ADJUSTMENT_OPTIONS.find((option) => option.value === factor);
  return match ? match.label : "Standard";
}

export function nextReference(prefix, items, field) {
  const year = new Date().getFullYear();
  const count = items.filter((item) => String(item[field] || "").includes(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
}

export function generatedRoomDescription(room) {
  const roomLabel = room.roomName || roomNameFromDraft(room);
  const jobLabel = room.jobType === "Other" ? room.otherJobType || "Custom works" : room.jobType;
  const bits = [];
  if (room.ceiling === "Yes") bits.push("ceiling preparation and coating");
  if (room.jobType === "Painting" || room.jobType === "Combination") bits.push("wall painting");
  if (room.jobType === "Wallpapering" || room.jobType === "Combination") bits.push("wallpapering");
  if (room.skirtingBoards !== "No") bits.push(`skirting boards (${room.skirtingBoards.toLowerCase()})`);
  if (room.architrave !== "No") bits.push(`architrave (${room.architrave.toLowerCase()})`);
  if (room.doors !== "No") bits.push(`doors (${room.doors.toLowerCase()})`);
  OTHER_FEATURE_KEYS.forEach(([key, label]) => {
    const value = room.otherFeatures?.[key];
    if (value && value !== "No") bits.push(`${label.toLowerCase()} (${value.toLowerCase()})`);
  });
  const joined = bits.length ? bits.join(", ") : "general decorating works";
  return `${roomLabel}: ${jobLabel} including ${joined}.`.trim();
}

export function calculateQuote(quote, rooms, settings) {
  const quoteRooms = rooms.filter((room) => quote?.roomIds?.includes(room.roomId));
  const labourSubtotal = quoteRooms.reduce((sum, room) => sum + number(room.finalRoomPrice), 0);
  const materialsTotal = quoteRooms.reduce((sum, room) => sum + (room.includeMaterials === "Yes" ? number(room.materialsCost) : 0), 0);
  const subtotalBeforeDiscount = labourSubtotal + materialsTotal;
  const discountAmount = quote?.discountType === "Custom"
    ? number(quote.customDiscount)
    : subtotalBeforeDiscount * (number(quote?.discountPercent) / 100);
  const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - discountAmount);
  const vatAmount = quote?.vatEnabled ? subtotalAfterDiscount * (number(settings.vatRate) / 100) : 0;
  const total = subtotalAfterDiscount + vatAmount;
  const depositAmount = quote?.depositType === "Fixed Amount" || quote?.depositType === "Custom"
    ? number(quote.depositCustom)
    : total * (number(String(quote?.depositType || "0").replace("%", "")) / 100);
  const duration = quoteRooms.reduce((sum, room) => sum + number(room.estimatedDays), 0);
  return {
    rooms: quoteRooms,
    labourSubtotal,
    materialsTotal,
    subtotalBeforeDiscount,
    discountAmount,
    subtotalAfterDiscount,
    vatAmount,
    total,
    depositAmount: Math.min(total, depositAmount),
    remainderAmount: Math.max(0, total - depositAmount),
    duration,
    completionDate: addDays(quote?.proposedStartDate, duration)
  };
}

export function calendarColour(type) {
  if (type === "Personal Time") return "bg-violet-400";
  if (type === "Potential Job (Unconfirmed)") return "bg-amber-300";
  if (type === "Other Work") return "bg-cyan-400";
  if (type === "Booked Job") return "bg-emerald-400";
  if (type === "Quote Visit") return "bg-amber-400";
  if (type === "Invoice Due") return "bg-rose-400";
  return "bg-fuchsia-400";
}

export function calendarTint(type) {
  if (type === "Personal Time") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (type === "Potential Job (Unconfirmed)") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (type === "Other Work") return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  if (type === "Booked Job") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (type === "Quote Visit") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (type === "Invoice Due") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200";
}

export function createRoomDraft(quoteId = "") {
  return {
    roomId: uid("room"),
    quoteId,
    roomPreset: "Living Room",
    roomOther: "",
    roomName: "Living Room",
    jobType: "Painting",
    otherJobType: "",
    ceiling: "No",
    ceilingNotes: "",
    wallsPaint: "Yes",
    paintNotes: "",
    wallpapering: "No",
    wallpaperingNotes: "",
    skirtingBoards: "No",
    architrave: "No",
    doors: "No",
    woodworkNotes: "",
    otherFeatures: {
      dadoRails: "No",
      pictureRails: "No",
      radiators: "No",
      windowSill: "No",
      banister: "No",
      spindles: "No",
      stairsFeature: "No",
      floor: "No",
      other: "No"
    },
    otherNotes: "",
    generatedDescription: "",
    paintSpecifics: "",
    materials: "",
    materialsSuppliedBy: "Decorator",
    materialsCost: 0,
    includeMaterials: "Yes",
    estimatedDays: 0.5,
    adjustmentFactor: 1,
    overridePrice: "",
    autoPrice: 0,
    finalRoomPrice: 0,
    notes: ""
  };
}

export function updateLinkedCollections(clientId, quoteIds, roomIds, removeItem) {
  quoteIds.forEach((quoteId) => removeItem("quotes", "quoteId", quoteId));
  roomIds.forEach((roomId) => removeItem("rooms", "roomId", roomId));
  quoteIds.forEach((quoteId) => removeItem("invoices", "quoteId", quoteId));
  quoteIds.forEach((quoteId) => removeItem("calendarEntries", "quoteId", quoteId));
  roomIds.forEach((roomId) => removeItem("photos", "roomId", roomId));
  removeItem("photos", "clientId", clientId);
  removeItem("calendarEntries", "clientId", clientId);
}

export function normaliseState(source = {}) {
  const merged = { ...initialState, ...(source || {}) };
  merged.settings = { ...initialState.settings, ...(merged.settings || {}) };
  merged.clients = (merged.clients || []).map((client) => {
    const split = splitName(client.name);
    return {
      ...client,
      surname: client.surname || split.surname,
      givenName: client.givenName || split.givenName
    };
  });
  merged.quotes = (merged.quotes || []).map((quote) => ({
    paymentPlan: "Deposit and remainder due on completion",
    depositType: merged.settings.defaultDeposit,
    depositCustom: 0,
    depositAmount: 0,
    totalAmount: 0,
    vatAmount: 0,
    vatEnabled: merged.settings.vatEnabled,
    discountType: "No Discount",
    discountPercent: 0,
    customDiscount: 0,
    wholeJobSpecifics: "",
    roomIds: [],
    ...quote
  }));
  merged.rooms = (merged.rooms || []).map((room) => ({
    ...room,
    roomName: room.roomName || "Living Room",
    roomPreset: room.roomPreset || room.roomName || "Living Room",
    roomOther: room.roomOther || "",
    jobType: room.jobType || "Painting",
    otherJobType: room.otherJobType || "",
    ceiling: room.ceiling || "No",
    wallsPaint: room.wallsPaint || "No",
    wallpapering: room.wallpapering || "No",
    skirtingBoards: room.skirtingBoards || "No",
    architrave: room.architrave || "No",
    doors: room.doors || "No",
    otherFeatures: {
      dadoRails: room.otherFeatures?.dadoRails || "No",
      pictureRails: room.otherFeatures?.pictureRails || "No",
      radiators: room.otherFeatures?.radiators || "No",
      windowSill: room.otherFeatures?.windowSill || "No",
      banister: room.otherFeatures?.banister || "No",
      spindles: room.otherFeatures?.spindles || "No",
      stairsFeature: room.otherFeatures?.stairsFeature || room.otherFeatures?.stairs || "No",
      floor: room.otherFeatures?.floor || "No",
      other: room.otherFeatures?.other || "No"
    },
    adjustmentFactor: room.adjustmentFactor || room.pricingAdjustmentValue || factorFromLegacy(room.pricingAdjustment),
    estimatedDays: number(room.estimatedDays || 1)
  }));
  merged.photos = (merged.photos || []).map((photo) => ({
    ...photo,
    imageUrl: photo.imageUrl || photo.imageData || "",
    uploadedDate: photo.uploadedDate || today()
  }));
  merged.calendarEntries = (merged.calendarEntries || []).map((entry) => ({
    syncStatus: "not_connected",
    externalCalendarId: "",
    externalEventId: "",
    externalProvider: "",
    ...entry
  }));
  return merged;
}

export function loadLegacyWorkspace() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    parsed = null;
  }
  if (!parsed) {
    for (const key of LEGACY_KEYS) {
      try {
        const legacy = JSON.parse(localStorage.getItem(key) || "null");
        if (legacy) {
          parsed = legacy;
          break;
        }
      } catch {
        continue;
      }
    }
  }
  return normaliseState(parsed || initialState);
}

export function buildBackupPayload(data, user = null) {
  return {
    exportedAt: new Date().toISOString(),
    exportedBy: user?.email || "preview-mode",
    version: 2,
    data: normaliseState(data)
  };
}

export function parseBackupPayload(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return normaliseState(parsed?.data || parsed || initialState);
}

export function roomAutoPrice(room, dayRate = DAY_RATE) {
  return number(room.estimatedDays) * number(dayRate) * number(room.adjustmentFactor || 1);
}

export function defaultTimeOption(value) {
  return TIME_OPTIONS.find((option) => option.value === value) || TIME_OPTIONS[1];
}
