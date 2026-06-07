import { ADJUSTMENT_OPTIONS, DAY_RATE, LEGACY_KEYS, OTHER_FEATURE_KEYS, STORAGE_KEY, TIME_OPTIONS, initialState } from "./constants.js";

export const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = (value) => `£${number(value).toFixed(2)}`;
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
export const slug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const classNames = (...parts) => parts.filter(Boolean).join(" ");
export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const shortDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
export const monthStamp = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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

