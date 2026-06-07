import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bath,
  BedDouble,
  Briefcase,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Home,
  ImagePlus,
  Mail,
  MapPinned,
  Paintbrush2,
  Phone,
  PoundSterling,
  Save,
  Search,
  Settings as SettingsIcon,
  Sofa,
  SquarePen,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Utensils,
  Wallet,
  X
} from "lucide-react";

const h = React.createElement;
const STORAGE_KEY = "auty-decorating-mvp-v2";
const LEGACY_KEYS = ["auty-decorating-mvp-v1"];
const DAY_RATE = 150;
const VAT_RATE = 20;

const MAIN_TABS = ["Dashboard", "Calendar", "Client Database", "Current Job"];
const JOB_TABS = ["Room Quoter", "Job Overview", "Invoice Generator", "Photos & Attachments"];
const QUOTE_STATUSES = ["Draft", "Sent", "Awaiting Approval", "Accepted", "In Progress", "Complete", "Invoice Due", "Paid"];
const CALENDAR_TYPES = ["Confirmed Job", "Proposed Job", "Personal / Blocked Time", "Quote Visit", "Invoice / Payment Due"];
const PHOTO_TYPES = ["Before", "During", "After", "Damage", "Materials", "Other"];
const ROOM_PRESETS = [
  { key: "Living Room", label: "Living", icon: Sofa },
  { key: "Dining Room", label: "Dining", icon: Utensils },
  { key: "Kitchen", label: "Kitchen", icon: Home },
  { key: "Hallway", label: "Hall", icon: Home },
  { key: "Bathroom", label: "Bathroom", icon: Bath },
  { key: "Bedroom", label: "Bedroom", icon: BedDouble },
  { key: "Other", label: "Other", icon: Briefcase }
];
const OTHER_ROOM_OPTIONS = ["Master Bedroom", "Spare Bedroom", "Nursery", "En Suite", "Landing", "Stairs", "Porch", "Utility Room", "Office", "Garage", "Conservatory", "Garden Room", "Fence", "Garden Fence", "Shed", "Exterior Wall", "Front Door", "Internal Doors", "Other"];
const JOB_TYPE_OPTIONS = ["Painting", "Wallpapering", "Combination", "Other"];
const TOGGLE_THREE = ["Yes", "No", "Partial"];
const MATERIAL_SUPPLIERS = ["Decorator", "Client", "Mixed"];
const TIME_OPTIONS = [
  { label: "1/4 day", value: 0.25 },
  { label: "1/2 day", value: 0.5 },
  { label: "1 day", value: 1 },
  { label: "1.5 day", value: 1.5 },
  { label: "2 day", value: 2 },
  { label: "2.5 day", value: 2.5 },
  { label: "3 day", value: 3 }
];
const ADJUSTMENT_OPTIONS = [
  { label: "Standard", value: 1 },
  { label: "+5%", value: 1.05 },
  { label: "+10%", value: 1.1 },
  { label: "+15%", value: 1.15 },
  { label: "+20%", value: 1.2 }
];
const OTHER_FEATURE_KEYS = [
  ["dadoRails", "Dado Rails"],
  ["pictureRails", "Picture Rails"],
  ["radiators", "Radiators"],
  ["windowSill", "Window Sill"],
  ["banister", "Banister"],
  ["spindles", "Spindles"],
  ["stairsFeature", "Stairs"],
  ["floor", "Floor"],
  ["other", "Other"]
];

const initialState = {
  clients: [],
  quotes: [],
  rooms: [],
  photos: [],
  invoices: [],
  calendarEntries: [],
  settings: {
    businessName: "AUTY Decorating",
    dayRate: DAY_RATE,
    vatEnabled: true,
    vatRate: VAT_RATE,
    defaultDeposit: "20%",
    businessEmail: "",
    businessTelephone: "",
    businessAddress: "",
    paymentDetails: "Bank transfer details to be added."
  }
};

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value) => `£${number(value).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const slug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const classNames = (...parts) => parts.filter(Boolean).join(" ");
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const shortDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const monthStamp = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const addDays = (date, days) => {
  if (!date) return "";
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + Math.max(0, Math.ceil(number(days)) - 1));
  return next.toISOString().slice(0, 10);
};

function splitName(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return { surname: "", givenName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { surname: parts[0], givenName: "" };
  return { surname: parts[parts.length - 1], givenName: parts.slice(0, -1).join(" ") };
}

function displayName(client) {
  const surname = client?.surname || "";
  const givenName = client?.givenName || "";
  if (surname || givenName) return [givenName, surname].filter(Boolean).join(" ").trim();
  return client?.name || "New Client";
}

function databaseName(client) {
  const surname = client?.surname || "";
  const givenName = client?.givenName || "";
  if (surname || givenName) return `${surname || "Unknown"}, ${givenName}`.replace(/,\s$/, "");
  return client?.name || "Unknown";
}

function legacyAwareLoad() {
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
  const merged = { ...initialState, ...(parsed || {}) };
  merged.clients = (merged.clients || []).map((client) => {
    const split = splitName(client.name);
    return {
      ...client,
      surname: client.surname || split.surname,
      givenName: client.givenName || split.givenName
    };
  });
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
  return merged;
}

function factorFromLegacy(label) {
  if (label === "+5%") return 1.05;
  if (label === "+10%") return 1.1;
  if (label === "+15%") return 1.15;
  if (label === "+20%") return 1.2;
  if (label === "+30%") return 1.3;
  return 1;
}

function nextReference(prefix, items, field) {
  const year = new Date().getFullYear();
  const count = items.filter((item) => String(item[field] || "").includes(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
}

function roomNameFromDraft(room) {
  if (room.roomPreset !== "Other") return room.roomPreset;
  return room.roomOther || "Other";
}

function adjustmentLabel(factor) {
  const match = ADJUSTMENT_OPTIONS.find((option) => option.value === factor);
  return match ? match.label : "Standard";
}

function generatedRoomDescription(room) {
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

function calculateQuote(quote, rooms, settings) {
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

function calendarColour(type) {
  if (type === "Confirmed Job") return "bg-emerald-500";
  if (type === "Proposed Job") return "bg-amber-500";
  if (type === "Personal / Blocked Time") return "bg-slate-500";
  if (type === "Quote Visit") return "bg-sky-500";
  return "bg-rose-500";
}

function calendarTint(type) {
  if (type === "Confirmed Job") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (type === "Proposed Job") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (type === "Personal / Blocked Time") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (type === "Quote Visit") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function createRoomDraft(quoteId = "") {
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

function App() {
  const [data, setData] = useState(legacyAwareLoad);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [jobTab, setJobTab] = useState("Room Quoter");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedClient = data.clients.find((client) => client.clientId === selectedClientId) || data.clients[0] || null;
  const selectedQuote = data.quotes.find((quote) => quote.quoteId === selectedQuoteId)
    || data.quotes.find((quote) => quote.clientId === selectedClient?.clientId)
    || data.quotes[0]
    || null;

  const update = (key, updater) => {
    setData((current) => ({
      ...current,
      [key]: typeof updater === "function" ? updater(current[key], current) : updater
    }));
  };

  const upsert = (key, item, idField) => {
    update(key, (items) => items.some((entry) => entry[idField] === item[idField])
      ? items.map((entry) => entry[idField] === item[idField] ? item : entry)
      : [item, ...items]);
  };

  const removeItem = (key, idField, idValue) => {
    update(key, (items) => items.filter((entry) => entry[idField] !== idValue));
  };

  const createClient = (seed = {}) => {
    const split = splitName(seed.name || "");
    const client = {
      clientId: uid("client"),
      surname: seed.surname || split.surname || "Client",
      givenName: seed.givenName || split.givenName || "",
      name: seed.name || "",
      address: "",
      contactDetails: "",
      telephone: "",
      email: "",
      notes: "",
      createdDate: today(),
      ...seed
    };
    upsert("clients", client, "clientId");
    setSelectedClientId(client.clientId);
    setNotice("Client created");
    return client;
  };

  const saveQuoteTotals = (quote) => {
    const calc = calculateQuote(quote, data.rooms, data.settings);
    const updated = {
      ...quote,
      estimatedDuration: calc.duration,
      estimatedCompletionDate: calc.completionDate,
      depositAmount: calc.depositAmount,
      totalAmount: calc.total,
      vatAmount: calc.vatAmount
    };
    upsert("quotes", updated, "quoteId");
    return updated;
  };

  const createQuote = (clientId = selectedClient?.clientId || "") => {
    if (!clientId) {
      const client = createClient();
      clientId = client.clientId;
    }
    const quote = {
      quoteId: uid("quote"),
      clientId,
      quoteReference: nextReference("AUTY-Q", data.quotes, "quoteReference"),
      quoteDate: today(),
      proposedStartDate: "",
      estimatedDuration: 0,
      estimatedCompletionDate: "",
      quoteStatus: "Draft",
      paymentPlan: "Deposit and remainder due on completion",
      depositType: data.settings.defaultDeposit,
      depositCustom: 0,
      depositAmount: 0,
      totalAmount: 0,
      vatAmount: 0,
      finalNotes: "",
      vatEnabled: data.settings.vatEnabled,
      discountType: "No Discount",
      discountPercent: 0,
      customDiscount: 0,
      wholeJobSpecifics: "",
      roomIds: []
    };
    upsert("quotes", quote, "quoteId");
    setSelectedClientId(clientId);
    setSelectedQuoteId(quote.quoteId);
    setActiveTab("Current Job");
    setJobTab("Room Quoter");
    setNotice("New quote started");
    return quote;
  };

  const generatePdf = (kind, quote, invoice) => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF || !quote) {
      setNotice("PDF library unavailable");
      return;
    }
    const client = data.clients.find((entry) => entry.clientId === quote.clientId);
    const calc = calculateQuote(quote, data.rooms, data.settings);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 14;
    const usableWidth = pageWidth - margin * 2;
    let y = 18;

    const ensureSpace = (height) => {
      if (y + height < 282) return;
      doc.addPage();
      y = 18;
    };

    const write = (text, options = {}) => {
      const size = options.size || 10;
      const bold = options.bold || false;
      const colour = options.colour || [24, 34, 48];
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...colour);
      doc.setFontSize(size);
      const split = doc.splitTextToSize(String(text || ""), options.width || usableWidth);
      ensureSpace(split.length * size * 0.48 + 5);
      doc.text(split, options.x || margin, y);
      y += split.length * size * 0.48 + (options.gap || 4);
    };

    const block = (title, lines, tone = [247, 244, 236]) => {
      const height = 12 + lines.length * 7;
      ensureSpace(height + 6);
      doc.setFillColor(...tone);
      doc.roundedRect(margin, y - 4, usableWidth, height, 3, 3, "F");
      write(title, { bold: true, size: 12 });
      lines.forEach((line) => write(line, { size: 10, gap: 3 }));
      y += 2;
    };

    doc.setFillColor(24, 34, 48);
    doc.roundedRect(margin, 12, usableWidth, 28, 4, 4, "F");
    y = 22;
    write(data.settings.businessName || "AUTY Decorating", { size: 20, bold: true, colour: [255, 255, 255], gap: 6 });
    write(kind === "quote" ? `Quotation ${quote.quoteReference}` : `Invoice ${invoice.invoiceReference}`, { size: 13, bold: true, colour: [234, 188, 76], gap: 0 });
    y = 48;

    block("Client", [
      `${displayName(client)}`,
      client?.address || "Address not set",
      [client?.telephone, client?.email].filter(Boolean).join(" | ") || "Contact details not set"
    ]);

    block(kind === "quote" ? "Schedule" : "Payment", kind === "quote"
      ? [
        `Quote date: ${shortDate(quote.quoteDate)}`,
        `Proposed start date: ${shortDate(quote.proposedStartDate)}`,
        `Estimated duration: ${calc.duration} days`,
        `Estimated completion: ${shortDate(calc.completionDate)}`
      ]
      : [
        `Invoice date: ${shortDate(invoice.invoiceDate)}`,
        `Original quote: ${quote.quoteReference}`,
        `Payment due date: ${shortDate(invoice.paymentDueDate)}`,
        `Invoice status: ${invoice.invoiceStatus}`
      ], kind === "quote" ? [247, 244, 236] : [238, 248, 244]);

    ensureSpace(18);
    write("Room Breakdown", { bold: true, size: 12 });
    doc.setFillColor(232, 238, 248);
    doc.roundedRect(margin, y - 1, usableWidth, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Room", margin + 3, y + 5);
    doc.text("Type", margin + 62, y + 5);
    doc.text("Time", margin + 104, y + 5);
    doc.text("Price", margin + 130, y + 5);
    doc.text("Description", margin + 154, y + 5);
    y += 12;

    calc.rooms.forEach((room) => {
      const description = doc.splitTextToSize(room.generatedDescription, 40);
      const rowHeight = Math.max(10, description.length * 4 + 4);
      ensureSpace(rowHeight + 2);
      doc.setDrawColor(226, 221, 207);
      doc.roundedRect(margin, y - 3, usableWidth, rowHeight, 2, 2, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(room.roomName, margin + 3, y + 2);
      doc.setFont("helvetica", "normal");
      doc.text(room.jobType === "Other" ? room.otherJobType || "Other" : room.jobType, margin + 62, y + 2);
      doc.text(`${room.estimatedDays} d`, margin + 104, y + 2);
      doc.text(money(room.finalRoomPrice), margin + 130, y + 2);
      doc.text(description, margin + 154, y + 2);
      y += rowHeight + 2;
    });

    block("Price Summary", [
      `Labour subtotal: ${money(calc.labourSubtotal)}`,
      `Materials total: ${money(calc.materialsTotal)}`,
      `Discount: ${money(calc.discountAmount)}`,
      `VAT: ${money(calc.vatAmount)}`,
      `Total: ${money(calc.total)}`,
      `Deposit due now: ${money(calc.depositAmount)}`,
      `Remainder due on completion: ${money(calc.remainderAmount)}`
    ], [255, 247, 229]);

    if (quote.wholeJobSpecifics) {
      block("Whole Job Specifics", doc.splitTextToSize(quote.wholeJobSpecifics, usableWidth - 8), [244, 246, 255]);
    }

    if (kind === "invoice" && invoice) {
      block("Invoice Notes", [
        `Deposit paid: ${money(invoice.depositPaid)}`,
        `Balance due: ${money(invoice.balanceDue)}`,
        `Payment details: ${data.settings.paymentDetails || "To be confirmed"}`
      ], [244, 246, 255]);
    } else {
      block("Acceptance", [
        "This quotation is valid for 30 days.",
        "Accepted by: ______________________________",
        "Date: ______________________________"
      ], [244, 246, 255]);
    }

    doc.save(kind === "quote" ? `${quote.quoteReference}.pdf` : `${invoice.invoiceReference}.pdf`);
  };

  const pageProps = {
    data,
    update,
    upsert,
    removeItem,
    createClient,
    createQuote,
    selectedClient,
    selectedQuote,
    setSelectedClientId,
    setSelectedQuoteId,
    setActiveTab,
    setJobTab,
    saveQuoteTotals,
    generatePdf,
    setNotice
  };

  return h("div", { className: "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,220,140,0.25),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(111,168,220,0.16),_transparent_28%),linear-gradient(180deg,_#f8f0e6_0%,_#fffaf4_100%)] pb-28 text-auty-ink" },
    h("div", { className: "mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6" },
      h("header", { className: "sticky top-0 z-30 mb-5 rounded-[28px] border border-white/60 bg-white/75 px-4 py-4 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur-xl" },
        h("div", { className: "flex items-center justify-between gap-4" },
          h("div", null,
            h("p", { className: "text-[11px] font-bold uppercase tracking-[0.28em] text-auty-gold" }, "Auty Decorating Workspace App"),
            h("h1", { className: "mt-1 text-2xl font-black tracking-tight text-slate-900" }, activeTab === "Current Job" ? jobTab : activeTab)
          ),
          h("button", {
            onClick: () => setShowSettings(true),
            className: "grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
          }, h(SettingsIcon, { size: 20 }))
        )
      ),
      h("div", { className: "animate-[fadeIn_.45s_ease] flex-1" },
        activeTab === "Dashboard" && h(DashboardPage, pageProps),
        activeTab === "Calendar" && h(CalendarPage, pageProps),
        activeTab === "Client Database" && h(ClientDatabasePage, pageProps),
        activeTab === "Current Job" && h(CurrentJobPage, { ...pageProps, jobTab, setJobTab })
      )
    ),
    h(FloatingNav, { activeTab, setActiveTab }),
    showSettings && h(SettingsPanel, { data, update, setShowSettings, setNotice }),
    notice && h("div", { className: "fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl animate-[slideIn_.3s_ease]" }, notice)
  );
}

function FloatingNav({ activeTab, setActiveTab }) {
  const items = [
    { label: "Calendar", icon: CalendarDays },
    { label: "Dashboard", icon: ClipboardList },
    { label: "Client Database", icon: Users },
    { label: "Current Job", icon: Home }
  ];
  return h("nav", { className: "fixed bottom-4 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-[28px] border border-white/60 bg-slate-950/92 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl" },
    h("div", { className: "grid grid-cols-4 gap-2" },
      items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.label;
        return h("button", {
          key: item.label,
          onClick: () => setActiveTab(item.label),
          className: classNames(
            "flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-bold transition duration-300",
            active ? "bg-[linear-gradient(135deg,#f0b552,#df7a44)] text-white shadow-lg" : "text-white/72 hover:bg-white/10 hover:text-white"
          )
        }, h(Icon, { size: 20 }), item.label);
      })
    )
  );
}

function DashboardPage({ data, createClient, createQuote, setActiveTab, setJobTab }) {
  const upcoming = data.calendarEntries.filter((entry) => entry.type === "Confirmed Job" && entry.startDate >= today()).length;
  const awaiting = data.quotes.filter((quote) => quote.quoteStatus === "Awaiting Approval" || quote.quoteStatus === "Sent").length;
  const invoices = data.invoices.filter((invoice) => invoice.invoiceStatus !== "Paid").length;
  const blocked = data.calendarEntries.filter((entry) => entry.type === "Personal / Blocked Time").length;
  const recentQuotes = data.quotes.slice(0, 4);
  const latestClients = data.clients.slice(0, 4);
  const statCards = [
    ["Jobs", upcoming, "from-emerald-400 to-teal-500"],
    ["Quotes", awaiting, "from-amber-400 to-orange-500"],
    ["Invoices", invoices, "from-rose-400 to-pink-500"],
    ["Blocked", blocked, "from-slate-400 to-slate-600"]
  ];

  return h("div", { className: "space-y-5" },
    h("section", { className: "grid gap-4 lg:grid-cols-[1.3fr_0.7fr]" },
      h("div", { className: "overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(24,34,48,0.98),rgba(55,89,123,0.92))] p-5 text-white shadow-[0_26px_70px_rgba(24,34,48,0.25)]" },
        h("p", { className: "text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300" }, "Today"),
        h("h2", { className: "mt-2 max-w-xl text-3xl font-black leading-tight" }, "Keep jobs moving, quotes clear, and payment follow-up tidy."),
        h("p", { className: "mt-3 max-w-2xl text-sm text-white/72" }, "This version is arranged for quick use on a busy day. The main job flow lives under Current Job, while your client list and diary stay one tap away."),
        h("div", { className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" },
          h(QuickAction, { label: "New Client", onClick: () => { createClient(); setActiveTab("Client Database"); }, icon: UserPlus, tone: "from-white to-amber-50 text-slate-900" }),
          h(QuickAction, { label: "New Quote", onClick: () => { createQuote(); setActiveTab("Current Job"); setJobTab("Room Quoter"); }, icon: ClipboardList, tone: "from-amber-400 to-orange-500 text-white" }),
          h(QuickAction, { label: "Open Calendar", onClick: () => setActiveTab("Calendar"), icon: CalendarDays, tone: "from-sky-400 to-blue-500 text-white" }),
          h(QuickAction, { label: "Invoices", onClick: () => { setActiveTab("Current Job"); setJobTab("Invoice Generator"); }, icon: Wallet, tone: "from-emerald-400 to-lime-500 text-slate-900" })
        )
      ),
      h("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-1" },
        statCards.map(([label, value, tone]) => h("div", { key: label, className: "rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-[0_16px_40px_rgba(24,34,48,0.08)] transition duration-300 hover:-translate-y-0.5" },
          h("div", { className: classNames("h-2 rounded-full bg-gradient-to-r", tone) }),
          h("div", { className: "mt-3 flex items-end justify-between gap-3" },
            h("div", null, h("p", { className: "text-sm font-semibold text-slate-500" }, label), h("p", { className: "mt-1 text-3xl font-black text-slate-900" }, value)),
            h("div", { className: classNames("rounded-2xl bg-gradient-to-br px-3 py-2 text-sm font-black text-white", tone) }, label)
          )
        ))
      )
    ),
    h("section", { className: "grid gap-4 lg:grid-cols-2" },
      h("div", { className: "rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "flex items-center justify-between" },
          h("h3", { className: "text-lg font-black text-slate-900" }, "Recent Quotes"),
          h("button", { onClick: () => { setActiveTab("Current Job"); setJobTab("Job Overview"); }, className: "text-sm font-bold text-auty-gold transition hover:text-orange-500" }, "Open job view")
        ),
        recentQuotes.length ? h("div", { className: "mt-4 space-y-3" },
          recentQuotes.map((quote) => h("div", { key: quote.quoteId, className: "rounded-[22px] bg-[linear-gradient(135deg,#fff8ee,#f8f3ff)] p-4 transition duration-300 hover:translate-x-1" },
            h("div", { className: "flex items-center justify-between gap-3" },
              h("div", null, h("p", { className: "font-black text-slate-900" }, quote.quoteReference), h("p", { className: "text-sm text-slate-500" }, quote.quoteStatus)),
              h("strong", { className: "text-slate-900" }, money(quote.totalAmount))
            )
          ))
        ) : h(EmptyState, { title: "No quotations yet", body: "Start a quote from the Current Job tab and it will appear here." })
      ),
      h("div", { className: "rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "flex items-center justify-between" },
          h("h3", { className: "text-lg font-black text-slate-900" }, "Latest Clients"),
          h("button", { onClick: () => setActiveTab("Client Database"), className: "text-sm font-bold text-auty-gold transition hover:text-orange-500" }, "Open database")
        ),
        latestClients.length ? h("div", { className: "mt-4 space-y-3" },
          latestClients.map((client) => h("div", { key: client.clientId, className: "rounded-[22px] bg-[linear-gradient(135deg,#eef7ff,#fff9f0)] p-4 transition duration-300 hover:translate-x-1" },
            h("p", { className: "text-base font-black text-slate-900" }, client.surname || splitName(client.name).surname || "Client"),
            h("p", { className: "text-sm text-slate-500" }, client.givenName || splitName(client.name).givenName || "No given name"),
            h("p", { className: "mt-1 text-sm text-slate-500" }, client.telephone || client.email || "No contact details yet")
          ))
        ) : h(EmptyState, { title: "No clients yet", body: "Add a client and they will be listed here for quick recall." })
      )
    )
  );
}

function QuickAction({ label, onClick, icon: Icon, tone }) {
  return h("button", {
    onClick,
    className: classNames("rounded-[22px] bg-gradient-to-br p-4 text-left font-black transition duration-300 hover:-translate-y-1 hover:shadow-xl", tone)
  },
    h(Icon, { size: 20 }),
    h("p", { className: "mt-4 text-sm" }, label)
  );
}

function CalendarPage({ data, upsert, setNotice }) {
  const [monthView, setMonthView] = useState(new Date());
  const [entry, setEntry] = useState({ title: "", type: "Personal / Blocked Time", startDate: today(), endDate: today(), clientId: "", quoteId: "", notes: "" });
  const monthGrid = buildMonthGrid(monthView, data.calendarEntries);
  const visibleEntries = data.calendarEntries
    .filter((item) => item.startDate.slice(0, 7) <= monthStamp(monthView) && item.endDate.slice(0, 7) >= monthStamp(monthView))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const overlaps = data.calendarEntries.some((item) => item.type === "Personal / Blocked Time" && entry.type !== "Personal / Blocked Time" && entry.startDate <= item.endDate && entry.endDate >= item.startDate);

  const saveEntry = () => {
    if (!entry.title || !entry.startDate) {
      setNotice("Title and start date are required");
      return;
    }
    upsert("calendarEntries", { ...entry, calendarEntryId: uid("cal") }, "calendarEntryId");
    setEntry({ ...entry, title: "", notes: "" });
    setNotice(overlaps ? "Calendar booking saved with overlap warning" : "Calendar booking saved");
  };

  return h("div", { className: "grid gap-5 lg:grid-cols-[1.3fr_0.7fr]" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Business Calendar"),
          h("h2", { className: "text-2xl font-black text-slate-900" }, `${monthNames[monthView.getMonth()]} ${monthView.getFullYear()}`)
        ),
        h("div", { className: "flex items-center gap-2" },
          h(IconButton, { icon: ChevronLeft, onClick: () => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1)) }),
          h(IconButton, { icon: ChevronRight, onClick: () => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1)) })
        )
      ),
      h("div", { className: "mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400" },
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => h("div", { key: day, className: "py-2" }, day))
      ),
      h("div", { className: "mt-2 grid grid-cols-7 gap-2" },
        monthGrid.map((day) => h("div", {
          key: `${day.date}-${day.inMonth}`,
          className: classNames(
            "min-h-[110px] rounded-[24px] border p-3 transition duration-300 hover:-translate-y-0.5",
            day.inMonth ? "border-white/70 bg-[linear-gradient(180deg,#ffffff,#f7f3ec)] shadow-[0_10px_24px_rgba(24,34,48,0.05)]" : "border-white/40 bg-white/40 text-slate-400"
          )
        },
          h("div", { className: "flex items-center justify-between" },
            h("span", { className: classNames("grid h-8 w-8 place-items-center rounded-2xl text-sm font-black", day.date === today() ? "bg-slate-900 text-white" : "text-slate-700") }, new Date(`${day.date}T12:00:00`).getDate())
          ),
          h("div", { className: "mt-3 space-y-2" },
            day.entries.slice(0, 3).map((entryItem) => h("div", { key: entryItem.calendarEntryId, className: classNames("rounded-2xl px-2 py-1 text-[11px] font-bold text-white", calendarColour(entryItem.type)) }, entryItem.title)),
            day.entries.length > 3 && h("p", { className: "text-[11px] font-bold text-slate-400" }, `+${day.entries.length - 3} more`)
          )
        ))
      )
    ),
    h("aside", { className: "space-y-4" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Add Booking"),
        h("div", { className: "mt-4 space-y-3" },
          h(Field, { label: "Title", value: entry.title, onChange: (value) => setEntry({ ...entry, title: value }) }),
          h(Field, { label: "Type", value: entry.type, options: CALENDAR_TYPES, onChange: (value) => setEntry({ ...entry, type: value }) }),
          h(Field, { label: "Start Date", value: entry.startDate, type: "date", onChange: (value) => setEntry({ ...entry, startDate: value }) }),
          h(Field, { label: "End Date", value: entry.endDate, type: "date", onChange: (value) => setEntry({ ...entry, endDate: value }) }),
          h(Field, {
            label: "Client",
            value: entry.clientId,
            options: [{ value: "", label: "No client" }, ...data.clients.map((client) => ({ value: client.clientId, label: databaseName(client) }))],
            onChange: (value) => setEntry({ ...entry, clientId: value })
          }),
          h(Field, {
            label: "Quote / Job",
            value: entry.quoteId,
            options: [{ value: "", label: "No quote" }, ...data.quotes.map((quote) => ({ value: quote.quoteId, label: quote.quoteReference }))],
            onChange: (value) => {
              const quote = data.quotes.find((item) => item.quoteId === value);
              const client = data.clients.find((item) => item.clientId === quote?.clientId);
              const calc = quote ? calculateQuote(quote, data.rooms, data.settings) : null;
              setEntry({
                ...entry,
                quoteId: value,
                clientId: quote?.clientId || entry.clientId,
                title: quote ? `${displayName(client)} decorating job` : entry.title,
                type: quote ? "Proposed Job" : entry.type,
                startDate: quote?.proposedStartDate || entry.startDate,
                endDate: calc?.completionDate || entry.endDate,
                notes: quote ? quote.quoteReference : entry.notes
              });
            }
          }),
          h(Field, { label: "Notes", value: entry.notes, textarea: true, onChange: (value) => setEntry({ ...entry, notes: value }) }),
          overlaps && h("div", { className: "rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700" }, "This booking overlaps with a blocked date."),
          h(ActionButton, { label: "Save Calendar Entry", onClick: saveEntry, icon: Save })
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Month Entries"),
        visibleEntries.length ? h("div", { className: "mt-4 space-y-3" },
          visibleEntries.map((entryItem) => h("div", { key: entryItem.calendarEntryId, className: "rounded-[22px] bg-[linear-gradient(135deg,#fefefe,#f8f3ec)] p-4 shadow-sm" },
            h("div", { className: "flex items-start justify-between gap-3" },
              h("div", null,
                h("span", { className: classNames("inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1", calendarTint(entryItem.type)) }, entryItem.type),
                h("p", { className: "mt-2 font-black text-slate-900" }, entryItem.title),
                h("p", { className: "text-sm text-slate-500" }, `${shortDate(entryItem.startDate)} to ${shortDate(entryItem.endDate)}`)
              ),
              h(IconButton, { icon: Download, onClick: () => exportIcs(entryItem) })
            )
          ))
        ) : h(EmptyState, { title: "No entries in this month", body: "Add bookings, quote visits, jobs, or blocked dates on the right." })
      )
    )
  );
}

function buildMonthGrid(monthView, entries) {
  const year = monthView.getFullYear();
  const month = monthView.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDay = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstDay);
  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const stamp = day.toISOString().slice(0, 10);
    days.push({
      date: stamp,
      inMonth: day.getMonth() === month && day.getDate() <= last.getDate(),
      entries: entries.filter((entry) => entry.startDate <= stamp && entry.endDate >= stamp)
    });
  }
  return days;
}

function ClientDatabasePage({ data, upsert, createClient, createQuote, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [editId, setEditId] = useState("");
  const [drafts, setDrafts] = useState({});

  const clients = [...data.clients]
    .sort((left, right) => databaseName(left).localeCompare(databaseName(right)))
    .filter((client) => {
      const hay = [
        client.surname,
        client.givenName,
        client.address,
        client.telephone,
        client.email,
        client.notes,
        ...data.quotes.filter((quote) => quote.clientId === client.clientId).map((quote) => quote.quoteReference),
        ...data.invoices.filter((invoice) => invoice.clientId === client.clientId).map((invoice) => invoice.invoiceReference)
      ].join(" ").toLowerCase();
      return hay.includes(query.toLowerCase());
    });

  const beginEdit = (client) => {
    setEditId(client.clientId);
    setDrafts({
      ...drafts,
      [client.clientId]: {
        ...client,
        surname: client.surname || splitName(client.name).surname,
        givenName: client.givenName || splitName(client.name).givenName
      }
    });
    setOpenId(client.clientId);
  };

  const saveClient = (clientId) => {
    const draft = drafts[clientId];
    if (!draft) return;
    upsert("clients", { ...draft, name: displayName(draft) }, "clientId");
    setEditId("");
    setOpenId("");
  };

  return h("div", { className: "space-y-5" },
    h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" },
        h("div", { className: "grow" },
          h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Client Database"),
          h("div", { className: "mt-3 flex items-center gap-3 rounded-[22px] bg-[linear-gradient(135deg,#f4f8ff,#fff7eb)] px-4 py-3 shadow-sm" },
            h(Search, { size: 18, className: "text-slate-400" }),
            h("input", {
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: "Search surname, given name, address, phone, email, notes or refs",
              className: "w-full bg-transparent text-sm outline-none"
            })
          )
        ),
        h(ActionButton, { label: "Add Client", onClick: () => createClient(), icon: UserPlus })
      )
    ),
    clients.length ? h("div", { className: "space-y-3" },
      clients.map((client) => {
        const open = openId === client.clientId;
        const editing = editId === client.clientId;
        const draft = drafts[client.clientId] || client;
        const quotes = data.quotes.filter((quote) => quote.clientId === client.clientId);
        const invoices = data.invoices.filter((invoice) => invoice.clientId === client.clientId);
        const photos = data.photos.filter((photo) => photo.clientId === client.clientId);
        return h("article", { key: client.clientId, className: "overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur transition duration-300 hover:-translate-y-0.5" },
          h("div", { className: "flex items-center justify-between gap-3 px-5 py-4" },
            h("div", null,
              editing
                ? h("div", { className: "grid gap-3 sm:grid-cols-2" },
                  h(Field, { label: "Surname", value: draft.surname, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, surname: value } }) }),
                  h(Field, { label: "Given Name", value: draft.givenName, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, givenName: value } }) })
                )
                : h(React.Fragment, null,
                  h("p", { className: "text-xl font-black text-slate-900" }, client.surname || splitName(client.name).surname || "Client"),
                  h("p", { className: "text-sm text-slate-500" }, client.givenName || splitName(client.name).givenName || "No given name")
                )
            ),
            h("div", { className: "flex items-center gap-2" },
              h(IconButton, { icon: editing ? Save : SquarePen, onClick: () => editing ? saveClient(client.clientId) : beginEdit(client) }),
              h(IconButton, { icon: open ? X : ChevronDown, onClick: () => setOpenId(open ? "" : client.clientId) })
            )
          ),
          open && h("div", { className: "border-t border-slate-100 px-5 pb-5 pt-4 animate-[fadeIn_.3s_ease]" },
            h("div", { className: "grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" },
              h("div", { className: "space-y-4" },
                h("div", { className: "rounded-[22px] bg-[linear-gradient(135deg,#f4f8ff,#fffaf2)] p-4" },
                  editing
                    ? h("div", { className: "grid gap-3 sm:grid-cols-2" },
                      h(Field, { label: "Phone Number", value: draft.telephone, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, telephone: value } }) }),
                      h(Field, { label: "E-Mail", value: draft.email, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, email: value } }) }),
                      h("div", { className: "sm:col-span-2" }, h(Field, { label: "Address", value: draft.address, textarea: true, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, address: value } }) })),
                      h("div", { className: "sm:col-span-2" }, h(Field, { label: "Notes", value: draft.notes, textarea: true, onChange: (value) => setDrafts({ ...drafts, [client.clientId]: { ...draft, notes: value } }) }))
                    )
                    : h(React.Fragment, null,
                      h("div", { className: "flex flex-wrap gap-2" },
                        h(LinkChip, { href: client.telephone ? `tel:${client.telephone}` : "", label: "Call", icon: Phone }),
                        h(LinkChip, { href: client.telephone ? `sms:${client.telephone}` : "", label: "SMS", icon: Phone }),
                        h(LinkChip, { href: client.telephone ? `https://wa.me/${client.telephone.replace(/\D/g, "")}` : "", label: "WA MSG", icon: Phone }),
                        h(LinkChip, { href: client.email ? `mailto:${client.email}` : "", label: "Email", icon: Mail })
                      ),
                      h("div", { className: "mt-3 space-y-2 text-sm" },
                        h(InfoRow, { label: "Phone Number", value: client.telephone || "Not set" }),
                        h(InfoRow, { label: "E-Mail", value: client.email || "Not set" }),
                        h("div", { className: "rounded-2xl bg-white/80 px-4 py-3" },
                          h("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400" }, "Address"),
                          client.address && h("a", { href: `https://maps.google.com/?q=${encodeURIComponent(client.address)}`, target: "_blank", rel: "noreferrer", className: "mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-auty-gold" }, h(MapPinned, { size: 16 }), client.address),
                          !client.address && h("p", { className: "mt-1 text-sm text-slate-500" }, "Not set")
                        ),
                        h("div", { className: "rounded-2xl bg-white/80 px-4 py-3" },
                          h("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400" }, "Notes"),
                          h("p", { className: "mt-1 text-sm text-slate-600" }, client.notes || "No notes yet")
                        )
                      )
                    )
                ),
                h("div", { className: "rounded-[22px] bg-[linear-gradient(135deg,#ffffff,#f6f6fb)] p-4" },
                  h("p", { className: "text-sm font-black text-slate-900" }, "Jobs"),
                  quotes.length ? h("div", { className: "mt-3 space-y-2" },
                    quotes.map((quote) => h("button", {
                      key: quote.quoteId,
                      onClick: () => {
                        setSelectedClientId(client.clientId);
                        setSelectedQuoteId(quote.quoteId);
                        setActiveTab("Current Job");
                        setJobTab("Job Overview");
                      },
                      className: "w-full rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    }, `${quote.quoteReference} | ${quote.quoteStatus}`))
                  ) : h("p", { className: "mt-2 text-sm text-slate-500" }, "No jobs yet")
                )
              ),
              h("div", { className: "space-y-4" },
                h("div", { className: "rounded-[22px] bg-[linear-gradient(135deg,#fff9ee,#f5fbf9)] p-4" },
                  h("p", { className: "text-sm font-black text-slate-900" }, "Actions"),
                  h("div", { className: "mt-3 grid gap-2" },
                    h(ActionButton, {
                      label: "New Quote",
                      onClick: () => {
                        setSelectedClientId(client.clientId);
                        createQuote(client.clientId);
                        setActiveTab("Current Job");
                        setJobTab("Room Quoter");
                      },
                      icon: ClipboardList
                    }),
                    h(ActionButton, {
                      label: "Current Job",
                      onClick: () => {
                        setSelectedClientId(client.clientId);
                        setActiveTab("Current Job");
                        setJobTab("Job Overview");
                      },
                      icon: Home,
                      variant: "soft"
                    })
                  )
                ),
                h(InfoPanel, { title: "Related Quotes", items: quotes.map((quote) => quote.quoteReference) }),
                h(InfoPanel, { title: "Related Invoices", items: invoices.map((invoice) => invoice.invoiceReference) }),
                h(InfoPanel, { title: "Related Photos", items: photos.map((photo) => photo.caption || photo.photoType) })
              )
            ),
            editing && h("div", { className: "mt-4" },
              h(ActionButton, { label: "Save Client", onClick: () => saveClient(client.clientId), icon: Save })
            )
          )
        );
      })
    ) : h(EmptyState, { title: "No clients found", body: "Add a client or change the search to see more results." })
  );
}

function CurrentJobPage(props) {
  const { jobTab, setJobTab } = props;
  return h("div", { className: "space-y-5" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-3 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("div", { className: "grid gap-2 sm:grid-cols-4" },
        JOB_TABS.map((tab) => h("button", {
          key: tab,
          onClick: () => setJobTab(tab),
          className: classNames(
            "rounded-[24px] px-4 py-4 text-sm font-black transition duration-300",
            jobTab === tab ? "bg-[linear-gradient(135deg,#223047,#4f789f)] text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-50"
          )
        }, tab))
      )
    ),
    jobTab === "Room Quoter" && h(RoomQuoterPage, props),
    jobTab === "Job Overview" && h(JobOverviewPage, props),
    jobTab === "Invoice Generator" && h(InvoiceGeneratorPage, props),
    jobTab === "Photos & Attachments" && h(PhotosPage, props)
  );
}

function RoomQuoterPage({ data, createClient, createQuote, selectedClient, selectedQuote, upsert, saveQuoteTotals, setNotice, setSelectedClientId, setSelectedQuoteId }) {
  const [draft, setDraft] = useState(createRoomDraft(selectedQuote?.quoteId || ""));
  const [existingClientId, setExistingClientId] = useState(selectedClient?.clientId || "");

  useEffect(() => {
    setDraft(createRoomDraft(selectedQuote?.quoteId || ""));
  }, [selectedQuote?.quoteId]);

  useEffect(() => {
    if (selectedClient?.clientId) setExistingClientId(selectedClient.clientId);
  }, [selectedClient?.clientId]);

  const quote = selectedQuote;
  const client = selectedClient;
  const roomName = roomNameFromDraft(draft);
  const autoPrice = number(draft.estimatedDays) * number(data.settings.dayRate) * number(draft.adjustmentFactor);
  const finalRoomPrice = draft.overridePrice !== "" ? number(draft.overridePrice) : autoPrice;
  const description = draft.generatedDescription || generatedRoomDescription({ ...draft, roomName });
  const quoteRooms = data.rooms.filter((room) => room.quoteId === quote?.quoteId);

  const selectOrCreateQuote = (mode) => {
    if (mode === "new") {
      const clientCreated = createClient();
      const quoteCreated = createQuote(clientCreated.clientId);
      setSelectedClientId(clientCreated.clientId);
      setSelectedQuoteId(quoteCreated.quoteId);
      return;
    }
    if (!existingClientId) {
      setNotice("Select an existing client first");
      return;
    }
    const quoteCreated = createQuote(existingClientId);
    setSelectedClientId(existingClientId);
    setSelectedQuoteId(quoteCreated.quoteId);
  };

  const clearForm = () => {
    setDraft(createRoomDraft(quote?.quoteId || ""));
    setNotice("Room form cleared");
  };

  const patch = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const patchFeature = (key, value) => setDraft((current) => ({ ...current, otherFeatures: { ...current.otherFeatures, [key]: value } }));

  const shouldShowPaintNotes = draft.jobType === "Painting" || draft.jobType === "Combination";
  const shouldShowWallpaperNotes = draft.jobType === "Wallpapering" || draft.jobType === "Combination";
  const woodworkActive = [draft.skirtingBoards, draft.architrave, draft.doors].some((value) => value !== "No");
  const ceilingNotesOpen = draft.ceiling === "Yes";
  const otherRoomOpen = draft.roomPreset === "Other";
  const customJobOpen = draft.jobType === "Other";

  const completeRoom = () => {
    if (!quote) {
      setNotice("Start a quote first");
      return;
    }
    if (!roomName) {
      setNotice("Choose the room first");
      return;
    }
    const savedRoom = {
      ...draft,
      quoteId: quote.quoteId,
      roomName,
      autoPrice,
      finalRoomPrice,
      generatedDescription: description
    };
    upsert("rooms", savedRoom, "roomId");
    const updatedQuote = {
      ...quote,
      roomIds: Array.from(new Set([...(quote.roomIds || []), savedRoom.roomId])),
      wholeJobSpecifics: [quote.wholeJobSpecifics, savedRoom.generatedDescription].filter(Boolean).join("\n")
    };
    saveQuoteTotals(updatedQuote);
    setDraft(createRoomDraft(quote.quoteId));
    setNotice("Room completed and added to quote");
  };

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.2fr_0.8fr]" },
    h("section", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between" },
          h("div", null,
            h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Room Quoter"),
            h("h2", { className: "text-2xl font-black text-slate-900" }, quote ? `${quote.quoteReference}${client ? ` | ${displayName(client)}` : ""}` : "Start a quote to begin")
          ),
          h("div", { className: "grid gap-2 sm:grid-cols-3" },
            h(ActionButton, { label: "New Quote (New Client)", onClick: () => selectOrCreateQuote("new"), icon: UserPlus }),
            h("div", { className: "space-y-2" },
              h(Field, {
                label: "Existing Client",
                value: existingClientId,
                options: [{ value: "", label: "Choose client" }, ...data.clients.map((entry) => ({ value: entry.clientId, label: databaseName(entry) }))],
                onChange: setExistingClientId
              }),
              h(ActionButton, { label: "New Quote (Assign Existing)", onClick: () => selectOrCreateQuote("existing"), icon: Users, variant: "soft", className: "w-full" })
            ),
            h(ActionButton, { label: "Clear Form", onClick: clearForm, icon: Trash2, variant: "danger" })
          )
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Room"),
        h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" },
          ROOM_PRESETS.map((room) => h(SelectCard, {
            key: room.key,
            active: draft.roomPreset === room.key,
            label: room.label,
            icon: room.icon,
            onClick: () => patch("roomPreset", room.key)
          }))
        ),
        otherRoomOpen && h("div", { className: "mt-4" }, h(Field, { label: "Other Room", value: draft.roomOther, options: OTHER_ROOM_OPTIONS, onChange: (value) => patch("roomOther", value) })),
        h("h3", { className: "mt-6 text-lg font-black text-slate-900" }, "Job Type"),
        h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" },
          JOB_TYPE_OPTIONS.map((option) => h(SelectPill, { key: option, active: draft.jobType === option, label: option, onClick: () => patch("jobType", option) }))
        ),
        customJobOpen && h("div", { className: "mt-4" }, h(Field, { label: "Other Job Type", value: draft.otherJobType, onChange: (value) => patch("otherJobType", value) })),
        h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
          shouldShowPaintNotes && h(Field, { label: "Paint Notes", value: draft.paintNotes, textarea: true, onChange: (value) => patch("paintNotes", value) }),
          shouldShowWallpaperNotes && h(Field, { label: "Wallpaper Notes", value: draft.wallpaperingNotes, textarea: true, onChange: (value) => patch("wallpaperingNotes", value) })
        )
      ),
      h("div", { className: "grid gap-5 lg:grid-cols-2" },
        h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
          h("h3", { className: "text-lg font-black text-slate-900" }, "Ceiling"),
          h("div", { className: "mt-4 flex gap-3" },
            ["Yes", "No"].map((value) => h(SelectPill, { key: value, active: draft.ceiling === value, label: value, onClick: () => patch("ceiling", value) }))
          ),
          ceilingNotesOpen && h("div", { className: "mt-4" }, h(Field, { label: "Ceiling Notes", value: draft.ceilingNotes, textarea: true, onChange: (value) => patch("ceilingNotes", value) }))
        ),
        h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
          h("h3", { className: "text-lg font-black text-slate-900" }, "Room Woodwork"),
          [["Skirting Boards", "skirtingBoards"], ["Architrave", "architrave"], ["Doors", "doors"]].map(([label, key]) => h("div", { key, className: "mt-4 rounded-[22px] bg-[linear-gradient(135deg,#f8fbff,#fffaf2)] p-3" },
            h("p", { className: "text-sm font-black text-slate-900" }, label),
            h("div", { className: "mt-3 flex flex-wrap gap-2" },
              TOGGLE_THREE.map((value) => h(SelectPill, { key: value, active: draft[key] === value, label: value, onClick: () => patch(key, value) }))
            )
          )),
          woodworkActive && h("div", { className: "mt-4" }, h(Field, { label: "Woodwork Notes", value: draft.woodworkNotes, textarea: true, onChange: (value) => patch("woodworkNotes", value) }))
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Other Features"),
        h("div", { className: "mt-4 grid gap-3 xl:grid-cols-2" },
          OTHER_FEATURE_KEYS.map(([key, label]) => h("div", { key, className: "rounded-[22px] bg-[linear-gradient(135deg,#fff9ef,#f4f8ff)] p-4" },
            h("p", { className: "text-sm font-black text-slate-900" }, label),
            h("div", { className: "mt-3 flex flex-wrap gap-2" },
              TOGGLE_THREE.map((value) => h(SelectPill, { key: value, active: draft.otherFeatures[key] === value, label: value, onClick: () => patchFeature(key, value) }))
            )
          ))
        ),
        h("div", { className: "mt-4" }, h(Field, { label: "Other Notes", value: draft.otherNotes, textarea: true, onChange: (value) => patch("otherNotes", value) }))
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "grid gap-4 lg:grid-cols-2" },
          h(Field, { label: "General Job Description", value: description, textarea: true, onChange: (value) => patch("generatedDescription", value) }),
          h(Field, { label: "Paint Specifics", value: draft.paintSpecifics, textarea: true, onChange: (value) => patch("paintSpecifics", value) }),
          h(Field, { label: "Materials", value: draft.materials, textarea: true, onChange: (value) => patch("materials", value) }),
          h(Field, { label: "Materials Supplied By", value: draft.materialsSuppliedBy, options: MATERIAL_SUPPLIERS, onChange: (value) => patch("materialsSuppliedBy", value) }),
          h(Field, { label: "Materials Cost", value: draft.materialsCost, type: "number", onChange: (value) => patch("materialsCost", value) }),
          h(Field, { label: "Include Materials In Quote", value: draft.includeMaterials, options: ["Yes", "No"], onChange: (value) => patch("includeMaterials", value) })
        )
      )
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#1f2f42,#345273)] p-5 text-white shadow-[0_22px_60px_rgba(24,34,48,0.24)]" },
        h("h3", { className: "text-lg font-black" }, "Room Estimate In Time"),
        h("div", { className: "mt-4 flex flex-wrap gap-2" },
          TIME_OPTIONS.map((option) => h(SelectPill, {
            key: option.label,
            active: draft.estimatedDays === option.value,
            label: option.label,
            inverse: true,
            onClick: () => patch("estimatedDays", option.value)
          }))
        ),
        h("h3", { className: "mt-6 text-lg font-black" }, "Price Adjustment"),
        h("div", { className: "mt-4 flex flex-wrap gap-2" },
          ADJUSTMENT_OPTIONS.map((option) => h(SelectPill, {
            key: option.label,
            active: draft.adjustmentFactor === option.value,
            label: option.label,
            inverse: true,
            onClick: () => patch("adjustmentFactor", option.value)
          }))
        ),
        h("div", { className: "mt-6 rounded-[24px] bg-white/10 p-4" },
          h("p", { className: "text-sm font-bold uppercase tracking-[0.2em] text-amber-200" }, "Final Room Price"),
          h("p", { className: "mt-2 text-4xl font-black" }, money(finalRoomPrice)),
          h("p", { className: "mt-2 text-sm text-white/72" }, `Auto price ${money(autoPrice)} | ${draft.estimatedDays} day(s) at ${money(data.settings.dayRate)} per day`)
        ),
        h("div", { className: "mt-4" }, h(Field, { label: "Override Price", value: draft.overridePrice, type: "number", onChange: (value) => patch("overridePrice", value) })),
        h(ActionButton, { label: "Complete Room", onClick: completeRoom, icon: Save, className: "mt-5 w-full" })
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Rooms In Quote"),
        quoteRooms.length ? h("div", { className: "mt-4 space-y-3" },
          quoteRooms.map((room) => h("div", { key: room.roomId, className: "rounded-[22px] bg-[linear-gradient(135deg,#f5faff,#fff8ef)] p-4 shadow-sm" },
            h("div", { className: "flex items-start justify-between gap-3" },
              h("div", null,
                h("p", { className: "font-black text-slate-900" }, room.roomName),
                h("p", { className: "text-sm text-slate-500" }, `${room.jobType === "Other" ? room.otherJobType || "Other" : room.jobType} | ${room.estimatedDays} day(s) | ${adjustmentLabel(room.adjustmentFactor || 1)}`)
              ),
              h("strong", { className: "text-slate-900" }, money(room.finalRoomPrice))
            )
          ))
        ) : h(EmptyState, { title: "No rooms added yet", body: "Complete a room and it will appear here straight away." })
      )
    )
  );
}

function JobOverviewPage({ data, selectedClient, selectedQuote, upsert, removeItem, saveQuoteTotals, generatePdf, setNotice }) {
  const [editingClient, setEditingClient] = useState(false);
  if (!selectedQuote) {
    return h(EmptyState, { title: "No current quote selected", body: "Start a quote in Room Quoter or pick a client with an existing job." });
  }
  const client = selectedClient || data.clients.find((entry) => entry.clientId === selectedQuote.clientId);
  const rooms = data.rooms.filter((room) => selectedQuote.roomIds.includes(room.roomId));
  const calc = calculateQuote(selectedQuote, data.rooms, data.settings);

  const updateQuote = (patch) => saveQuoteTotals({ ...selectedQuote, ...patch });
  const updateClient = (patch) => {
    if (!client) return;
    upsert("clients", { ...client, ...patch, name: displayName({ ...client, ...patch }) }, "clientId");
  };

  const deleteRoom = (roomId) => {
    removeItem("rooms", "roomId", roomId);
    const updated = {
      ...selectedQuote,
      roomIds: selectedQuote.roomIds.filter((id) => id !== roomId),
      wholeJobSpecifics: rooms.filter((room) => room.roomId !== roomId).map((room) => room.generatedDescription).join("\n")
    };
    saveQuoteTotals(updated);
    setNotice("Room removed from quote");
  };

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.15fr_0.85fr]" },
    h("section", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("div", null,
            h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Job Overview"),
            h("h2", { className: "text-2xl font-black text-slate-900" }, selectedQuote.quoteReference)
          ),
          h(IconButton, { icon: editingClient ? Save : SquarePen, onClick: () => setEditingClient(!editingClient) })
        ),
        h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
          editingClient
            ? h(React.Fragment, null,
              h(Field, { label: "Surname", value: client?.surname || "", onChange: (value) => updateClient({ surname: value }) }),
              h(Field, { label: "Given Name", value: client?.givenName || "", onChange: (value) => updateClient({ givenName: value }) }),
              h("div", { className: "lg:col-span-2" }, h(Field, { label: "Address", value: client?.address || "", textarea: true, onChange: (value) => updateClient({ address: value }) }))
            )
            : h(React.Fragment, null,
              h(InfoTile, { label: "Client", value: client ? databaseName(client) : "Unknown client" }),
              h(InfoTile, { label: "Display Name", value: client ? displayName(client) : "Unknown client" }),
              h(InfoTile, { label: "Address", value: client?.address || "Not set" }),
              h(InfoTile, { label: "Telephone", value: client?.telephone || "Not set" })
            )
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Rooms Overview"),
        rooms.length ? h("div", { className: "mt-4 space-y-3" },
          rooms.map((room) => h("div", { key: room.roomId, className: "rounded-[24px] bg-[linear-gradient(135deg,#ffffff,#f6f8fb)] p-4 shadow-sm" },
            h("div", { className: "flex items-start justify-between gap-3" },
              h("div", null,
                h("p", { className: "font-black text-slate-900" }, room.roomName),
                h("p", { className: "text-sm text-slate-500" }, `${room.jobType === "Other" ? room.otherJobType || "Other" : room.jobType} | ${room.estimatedDays} day(s) | ${adjustmentLabel(room.adjustmentFactor || 1)}`),
                h("p", { className: "mt-2 text-sm text-slate-600" }, room.generatedDescription)
              ),
              h("div", { className: "flex items-center gap-2" },
                h("strong", { className: "text-slate-900" }, money(room.finalRoomPrice)),
                h(IconButton, { icon: Trash2, onClick: () => deleteRoom(room.roomId) })
              )
            )
          ))
        ) : h(EmptyState, { title: "No rooms yet", body: "Add rooms in Room Quoter and they will appear here." })
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Notes and Payment"),
        h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
          h(Field, { label: "Proposed Start Date", value: selectedQuote.proposedStartDate, type: "date", onChange: (value) => updateQuote({ proposedStartDate: value }) }),
          h(Field, { label: "Quote Status", value: selectedQuote.quoteStatus, options: QUOTE_STATUSES, onChange: (value) => updateQuote({ quoteStatus: value }) }),
          h(Field, { label: "Overall Discount", value: selectedQuote.discountType, options: ["No Discount", "5%", "10%", "15%", "20%", "Custom"], onChange: (value) => updateQuote({ discountType: value, discountPercent: value === "Custom" || value === "No Discount" ? 0 : number(value.replace("%", "")) }) }),
          selectedQuote.discountType === "Custom" && h(Field, { label: "Custom Discount", value: selectedQuote.customDiscount, type: "number", onChange: (value) => updateQuote({ customDiscount: value }) }),
          h(Field, { label: "VAT", value: selectedQuote.vatEnabled ? "Enabled" : "Disabled", options: ["Enabled", "Disabled"], onChange: (value) => updateQuote({ vatEnabled: value === "Enabled" }) }),
          h(Field, { label: "Deposit Due Now", value: selectedQuote.depositType, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%", "Fixed Amount", "Custom"], onChange: (value) => updateQuote({ depositType: value }) }),
          (selectedQuote.depositType === "Fixed Amount" || selectedQuote.depositType === "Custom") && h(Field, { label: "Deposit Amount", value: selectedQuote.depositCustom, type: "number", onChange: (value) => updateQuote({ depositCustom: value }) }),
          h("div", { className: "lg:col-span-2" }, h(Field, { label: "Whole Job Specifics", value: selectedQuote.wholeJobSpecifics, textarea: true, onChange: (value) => updateQuote({ wholeJobSpecifics: value }) })),
          h("div", { className: "lg:col-span-2" }, h(Field, { label: "Final Notes", value: selectedQuote.finalNotes, textarea: true, onChange: (value) => updateQuote({ finalNotes: value }) }))
        )
      )
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#1f2f42,#345273)] p-5 text-white shadow-[0_22px_60px_rgba(24,34,48,0.24)]" },
        h("h3", { className: "text-lg font-black" }, "Job Totals"),
        h("div", { className: "mt-4 space-y-3 text-sm" },
          [["Labour subtotal", calc.labourSubtotal], ["Materials total", calc.materialsTotal], ["Subtotal before discount", calc.subtotalBeforeDiscount], ["Discount", -calc.discountAmount], ["Subtotal after discount", calc.subtotalAfterDiscount], ["VAT", calc.vatAmount], ["Job total", calc.total], ["Deposit due now", calc.depositAmount], ["Remainder due on completion", calc.remainderAmount]].map(([label, value]) => h("div", { key: label, className: "flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3" }, h("span", null, label), h("strong", null, money(value))))
        ),
        h("p", { className: "mt-4 text-sm text-white/72" }, `Estimated duration ${calc.duration} day(s) | Completion ${shortDate(calc.completionDate)}`),
        h(ActionButton, { label: "Generate Quote PDF", onClick: () => generatePdf("quote", selectedQuote), icon: Download, className: "mt-5 w-full" })
      )
    )
  );
}

function InvoiceGeneratorPage({ data, upsert, selectedQuote, generatePdf, setNotice }) {
  const [quoteId, setQuoteId] = useState(selectedQuote?.quoteId || data.quotes[0]?.quoteId || "");
  useEffect(() => {
    if (selectedQuote?.quoteId) setQuoteId(selectedQuote.quoteId);
  }, [selectedQuote?.quoteId]);
  const quote = data.quotes.find((entry) => entry.quoteId === quoteId) || selectedQuote || data.quotes[0];
  const calc = quote ? calculateQuote(quote, data.rooms, data.settings) : null;
  const client = data.clients.find((entry) => entry.clientId === quote?.clientId);
  const existingInvoice = data.invoices.find((invoice) => invoice.quoteId === quote?.quoteId);
  const [draftInvoice, setDraftInvoice] = useState(null);

  useEffect(() => {
    if (!quote || !calc) return;
    setDraftInvoice(existingInvoice || {
      invoiceId: uid("invoice"),
      clientId: quote.clientId,
      quoteId: quote.quoteId,
      invoiceReference: nextReference("AUTY-INV", data.invoices, "invoiceReference"),
      invoiceDate: today(),
      jobTotal: calc.total,
      depositPaid: calc.depositAmount,
      balanceDue: Math.max(0, calc.total - calc.depositAmount),
      paymentDueDate: addDays(today(), 14),
      invoiceStatus: "Invoice Due"
    });
  }, [quote?.quoteId, existingInvoice?.invoiceId, calc?.total, calc?.depositAmount]);

  if (!quote || !calc || !draftInvoice) {
    return h(EmptyState, { title: "No quote ready for invoicing", body: "Create or select a quote first." });
  }

  const saveAndGenerate = () => {
    const invoice = { ...draftInvoice, jobTotal: calc.total, balanceDue: Math.max(0, calc.total - number(draftInvoice.depositPaid)) };
    upsert("invoices", invoice, "invoiceId");
    generatePdf("invoice", quote, invoice);
    setNotice("Invoice generated");
  };

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.05fr_0.95fr]" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Invoice Generator"),
      h("h2", { className: "text-2xl font-black text-slate-900" }, "Final invoice layout"),
      h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
        h(Field, { label: "Quote To Invoice", value: quote.quoteId, options: data.quotes.map((entry) => ({ value: entry.quoteId, label: `${entry.quoteReference} - ${displayName(data.clients.find((client) => client.clientId === entry.clientId))}` })), onChange: setQuoteId }),
        h(Field, { label: "Invoice Reference", value: draftInvoice.invoiceReference, onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceReference: value }) }),
        h(Field, { label: "Invoice Date", value: draftInvoice.invoiceDate, type: "date", onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceDate: value }) }),
        h(Field, { label: "Payment Due Date", value: draftInvoice.paymentDueDate, type: "date", onChange: (value) => setDraftInvoice({ ...draftInvoice, paymentDueDate: value }) }),
        h(Field, { label: "Deposit Paid", value: draftInvoice.depositPaid, type: "number", onChange: (value) => setDraftInvoice({ ...draftInvoice, depositPaid: value, balanceDue: Math.max(0, calc.total - number(value)) }) }),
        h(Field, { label: "Invoice Status", value: draftInvoice.invoiceStatus, options: ["Invoice Due", "Part Paid", "Paid", "Overdue"], onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceStatus: value }) })
      ),
      h("div", { className: "mt-5 grid gap-3 sm:grid-cols-2" },
        h(InfoTile, { label: "Client", value: client ? displayName(client) : "Unknown client" }),
        h(InfoTile, { label: "Job Address", value: client?.address || "Not set" }),
        h(InfoTile, { label: "Original Quote", value: quote.quoteReference }),
        h(InfoTile, { label: "Completed Work Summary", value: quote.wholeJobSpecifics || "No summary added yet" })
      )
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#1f2f42,#345273)] p-5 text-white shadow-[0_22px_60px_rgba(24,34,48,0.24)]" },
        h("h3", { className: "text-lg font-black" }, "Invoice Totals"),
        h("div", { className: "mt-4 space-y-3 text-sm" },
          [["Final job total", calc.total], ["Deposit paid", draftInvoice.depositPaid], ["Remaining balance", draftInvoice.balanceDue], ["VAT breakdown", calc.vatAmount]].map(([label, value]) => h("div", { key: label, className: "flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3" }, h("span", null, label), h("strong", null, money(value))))
        ),
        h("p", { className: "mt-4 text-sm text-white/72" }, `Payment due by ${shortDate(draftInvoice.paymentDueDate)}`),
        h(ActionButton, { label: "Generate Final Invoice", onClick: saveAndGenerate, icon: FileText, className: "mt-5 w-full" })
      )
    )
  );
}

function PhotosPage({ data, upsert, selectedClient, selectedQuote, setNotice }) {
  const [form, setForm] = useState({ clientId: selectedClient?.clientId || "", quoteId: selectedQuote?.quoteId || "", roomId: "", photoType: "Before", caption: "" });
  useEffect(() => {
    setForm((current) => ({
      ...current,
      clientId: selectedClient?.clientId || current.clientId,
      quoteId: selectedQuote?.quoteId || current.quoteId
    }));
  }, [selectedClient?.clientId, selectedQuote?.quoteId]);

  const rooms = data.rooms.filter((room) => !form.quoteId || room.quoteId === form.quoteId);

  const upload = (file) => {
    if (!file || !form.clientId || !form.quoteId || !form.roomId) {
      setNotice("Choose client, quote and room before uploading");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      upsert("photos", {
        photoId: uid("photo"),
        clientId: form.clientId,
        quoteId: form.quoteId,
        roomId: form.roomId,
        imageData: reader.result,
        photoType: form.photoType,
        caption: form.caption,
        uploadedDate: today()
      }, "photoId");
      setForm({ ...form, caption: "" });
      setNotice("Photo attached");
    };
    reader.readAsDataURL(file);
  };

  return h("div", { className: "space-y-5" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Photos & Attachments"),
      h("h2", { className: "text-2xl font-black text-slate-900" }, "Attach room-specific progress photos"),
      h("div", { className: "mt-4 grid gap-4 lg:grid-cols-3" },
        h(Field, { label: "Assigned Client", value: form.clientId, options: [{ value: "", label: "Choose client" }, ...data.clients.map((client) => ({ value: client.clientId, label: databaseName(client) }))], onChange: (value) => setForm({ ...form, clientId: value }) }),
        h(Field, { label: "Assigned Quote / Job", value: form.quoteId, options: [{ value: "", label: "Choose quote" }, ...data.quotes.filter((quote) => !form.clientId || quote.clientId === form.clientId).map((quote) => ({ value: quote.quoteId, label: quote.quoteReference }))], onChange: (value) => setForm({ ...form, quoteId: value, roomId: "" }) }),
        h(Field, { label: "Assigned Room", value: form.roomId, options: [{ value: "", label: "Choose room" }, ...rooms.map((room) => ({ value: room.roomId, label: room.roomName }))], onChange: (value) => setForm({ ...form, roomId: value }) }),
        h(Field, { label: "Photo Type", value: form.photoType, options: PHOTO_TYPES, onChange: (value) => setForm({ ...form, photoType: value }) }),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Caption", value: form.caption, onChange: (value) => setForm({ ...form, caption: value }) })),
        h("label", { className: "grid min-h-[150px] cursor-pointer place-items-center rounded-[24px] border-2 border-dashed border-slate-200 bg-[linear-gradient(135deg,#fff9ee,#f5faff)] p-4 text-center transition hover:border-auty-gold" },
          h("div", null,
            h(Upload, { size: 24, className: "mx-auto text-auty-gold" }),
            h("p", { className: "mt-3 font-black text-slate-900" }, "Upload photo"),
            h("p", { className: "text-sm text-slate-500" }, "Before, during, after, materials, or damage images")
          ),
          h("input", { type: "file", accept: "image/*", className: "hidden", onChange: (event) => upload(event.target.files?.[0]) })
        )
      )
    ),
    data.photos.length ? h("section", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" },
      data.photos.map((photo) => {
        const client = data.clients.find((entry) => entry.clientId === photo.clientId);
        const room = data.rooms.find((entry) => entry.roomId === photo.roomId);
        return h("article", { key: photo.photoId, className: "overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1" },
          h("img", { src: photo.imageData, alt: photo.caption || photo.photoType, className: "h-60 w-full object-cover" }),
          h("div", { className: "p-4" },
            h("span", { className: classNames("inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1", calendarTint(photo.photoType === "Before" ? "Quote Visit" : photo.photoType === "After" ? "Confirmed Job" : "Proposed Job")) }, photo.photoType),
            h("p", { className: "mt-3 font-black text-slate-900" }, photo.caption || "No caption"),
            h("p", { className: "mt-1 text-sm text-slate-500" }, `${displayName(client)} | ${room?.roomName || "Room"} | ${shortDate(photo.uploadedDate)}`)
          )
        );
      })
    ) : h(EmptyState, { title: "No photos yet", body: "Upload a room photo and it will be attached to the current job." })
  );
}

function SettingsPanel({ data, update, setShowSettings, setNotice }) {
  const settings = data.settings;
  const patch = (field, value) => update("settings", { ...settings, [field]: value });
  const exportBackup = () => downloadText(`auty-decorating-backup-${today()}.json`, JSON.stringify(data, null, 2), "application/json");
  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState, ...parsed }));
        window.location.reload();
      } catch {
        setNotice("Backup import failed");
      }
    };
    if (file) reader.readAsText(file);
  };

  return h("div", { className: "fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" },
    h("div", { className: "mx-auto mt-6 w-[min(94vw,860px)] rounded-[34px] border border-white/70 bg-white/95 p-5 shadow-[0_28px_80px_rgba(24,34,48,0.22)]" },
      h("div", { className: "flex items-center justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Settings"),
          h("h2", { className: "text-2xl font-black text-slate-900" }, "Workspace settings and backups")
        ),
        h(IconButton, { icon: X, onClick: () => setShowSettings(false) })
      ),
      h("div", { className: "mt-5 grid gap-4 lg:grid-cols-2" },
        h(Field, { label: "Business Name", value: settings.businessName, onChange: (value) => patch("businessName", value) }),
        h(Field, { label: "Standard Day Rate", value: settings.dayRate, type: "number", onChange: (value) => patch("dayRate", value) }),
        h(Field, { label: "VAT Enabled", value: settings.vatEnabled ? "Yes" : "No", options: ["Yes", "No"], onChange: (value) => patch("vatEnabled", value === "Yes") }),
        h(Field, { label: "VAT Rate", value: settings.vatRate, type: "number", onChange: (value) => patch("vatRate", value) }),
        h(Field, { label: "Default Deposit", value: settings.defaultDeposit, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%"], onChange: (value) => patch("defaultDeposit", value) }),
        h(Field, { label: "Business Telephone", value: settings.businessTelephone, onChange: (value) => patch("businessTelephone", value) }),
        h(Field, { label: "Business Email", value: settings.businessEmail, onChange: (value) => patch("businessEmail", value) }),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Business Address", value: settings.businessAddress, textarea: true, onChange: (value) => patch("businessAddress", value) })),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Payment Details", value: settings.paymentDetails, textarea: true, onChange: (value) => patch("paymentDetails", value) }))
      ),
      h("div", { className: "mt-5 flex flex-wrap gap-3" },
        h(ActionButton, { label: "Export JSON Backup", onClick: exportBackup, icon: Download }),
        h("label", { className: "inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-[20px] bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800" },
          h(Upload, { size: 18 }),
          "Import JSON Backup",
          h("input", { type: "file", accept: "application/json", className: "hidden", onChange: (event) => importBackup(event.target.files?.[0]) })
        )
      )
    )
  );
}

function Field({ label, value, onChange, type = "text", options, textarea }) {
  const base = "mt-2 w-full rounded-[20px] border border-slate-200 bg-white/92 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-auty-gold focus:ring-4 focus:ring-amber-100";
  const optionList = options?.map((option) => typeof option === "object" ? option : { value: option, label: option });
  return h("label", { className: "block text-sm font-semibold text-slate-700" },
    label,
    options
      ? h("select", { value: value ?? "", onChange: (event) => onChange(event.target.value), className: base }, optionList.map((option) => h("option", { key: String(option.value), value: option.value }, option.label)))
      : textarea
        ? h("textarea", { rows: 4, value: value ?? "", onChange: (event) => onChange(event.target.value), className: base })
        : h("input", { type, step: type === "number" ? "0.01" : undefined, value: value ?? "", onChange: (event) => onChange(type === "number" ? number(event.target.value) : event.target.value), className: base })
  );
}

function ActionButton({ label, onClick, icon: Icon, variant = "primary", className = "" }) {
  const styles = variant === "danger"
    ? "bg-[linear-gradient(135deg,#d95454,#b6304a)] text-white"
    : variant === "soft"
      ? "bg-[linear-gradient(135deg,#eef4ff,#f7f9ff)] text-slate-900"
      : "bg-[linear-gradient(135deg,#f0b552,#df7a44)] text-white";
  return h("button", {
    onClick,
    className: classNames("inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg", styles, className)
  }, Icon && h(Icon, { size: 18 }), label);
}

function IconButton({ icon: Icon, onClick }) {
  return h("button", {
    onClick,
    className: "grid h-11 w-11 place-items-center rounded-[18px] bg-slate-100 text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:text-white"
  }, h(Icon, { size: 18 }));
}

function SelectPill({ label, active, onClick, inverse = false }) {
  return h("button", {
    onClick,
    className: classNames(
      "rounded-full px-4 py-2 text-sm font-black transition duration-300",
      inverse
        ? active ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white/78 hover:bg-white/16 hover:text-white"
        : active ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    )
  }, label);
}

function SelectCard({ label, active, onClick, icon: Icon }) {
  return h("button", {
    onClick,
    className: classNames(
      "rounded-[24px] border p-4 text-left transition duration-300",
      active ? "border-slate-900 bg-[linear-gradient(135deg,#fff7ee,#f4f8ff)] shadow-[0_14px_30px_rgba(24,34,48,0.12)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
    )
  },
    h(Icon, { size: 20, className: active ? "text-auty-gold" : "text-slate-400" }),
    h("p", { className: "mt-4 font-black text-slate-900" }, label)
  );
}

function EmptyState({ title, body }) {
  return h("div", { className: "rounded-[28px] border border-dashed border-slate-200 bg-white/72 px-6 py-10 text-center" },
    h("p", { className: "text-lg font-black text-slate-900" }, title),
    h("p", { className: "mt-2 text-sm text-slate-500" }, body)
  );
}

function InfoTile({ label, value }) {
  return h("div", { className: "rounded-[22px] bg-[linear-gradient(135deg,#f5faff,#fff8ef)] px-4 py-4 shadow-sm" },
    h("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400" }, label),
    h("p", { className: "mt-2 text-sm font-semibold text-slate-700" }, value)
  );
}

function InfoPanel({ title, items }) {
  return h("div", { className: "rounded-[22px] bg-[linear-gradient(135deg,#f5faff,#fff8ef)] p-4" },
    h("p", { className: "text-sm font-black text-slate-900" }, title),
    items.length ? h("div", { className: "mt-3 space-y-2" }, items.map((item) => h("div", { key: item, className: "rounded-2xl bg-white/72 px-3 py-2 text-sm text-slate-600" }, item))) : h("p", { className: "mt-2 text-sm text-slate-500" }, "Nothing here yet.")
  );
}

function InfoRow({ label, value }) {
  return h("div", { className: "rounded-2xl bg-white/80 px-4 py-3" },
    h("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400" }, label),
    h("p", { className: "mt-1 text-sm text-slate-700" }, value)
  );
}

function LinkChip({ href, label, icon: Icon }) {
  if (!href) {
    return h("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400" }, h(Icon, { size: 14 }), label);
  }
  return h("a", { href, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5" }, h(Icon, { size: 14 }), label);
}

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toIcsDate(value) {
  return String(value || today()).replaceAll("-", "");
}

function exportIcs(entry) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AUTY Decorating//Workspace App//EN",
    "BEGIN:VEVENT",
    `UID:${entry.calendarEntryId}@auty-decorating`,
    `DTSTAMP:${toIcsDate(today())}T090000Z`,
    `DTSTART;VALUE=DATE:${toIcsDate(entry.startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDays(entry.endDate || entry.startDate, 2))}`,
    `SUMMARY:${entry.title}`,
    `DESCRIPTION:${entry.type} - ${entry.notes || ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  downloadText(`${slug(entry.title)}.ics`, content, "text/calendar");
}

createRoot(document.getElementById("root")).render(h(App));
