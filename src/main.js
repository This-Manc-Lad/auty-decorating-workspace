import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Home,
  ImagePlus,
  LayoutDashboard,
  PoundSterling,
  Save,
  Search,
  Settings as SettingsIcon,
  Upload,
  Users,
  X
} from "lucide-react";

const h = React.createElement;
const STORAGE_KEY = "auty-decorating-mvp-v1";
const DAY_RATE = 150;
const VAT_RATE = 20;

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const money = (value) => `£${Number(value || 0).toFixed(2)}`;
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const addDays = (date, days) => {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + Math.ceil(number(days)) - 1);
  return d.toISOString().slice(0, 10);
};

const ROOM_NAMES = ["Living Room", "Dining Room", "Kitchen", "Bedroom", "Master Bedroom", "Spare Bedroom", "Nursery", "Bathroom", "En Suite", "Hallway", "Landing", "Stairs", "Porch", "Utility Room", "Office", "Garage", "Conservatory", "Garden Room", "Fence", "Garden Fence", "Shed", "Exterior Wall", "Front Door", "Internal Doors", "Other"];
const JOB_TYPES = ["Painting", "Wallpapering", "Combination", "Glossing", "Other"];
const YES_NO_PARTIAL = ["Yes", "No", "Partial"];
const CAL_TYPES = ["Confirmed Job", "Proposed Job", "Personal / Blocked Time", "Quote Visit", "Invoice / Payment Due"];
const PHOTO_TYPES = ["Before", "During", "After", "Damage", "Materials", "Other"];
const STATUSES = ["Draft", "Sent", "Awaiting Approval", "Accepted", "In Progress", "Complete", "Invoice Due", "Paid"];

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
    paymentDetails: "Payment details to be added."
  }
};

function loadData() {
  try {
    return { ...initialState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return initialState;
  }
}

function nextReference(prefix, items, field) {
  const year = new Date().getFullYear();
  const count = items.filter((item) => String(item[field] || "").includes(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
}

function calculateQuote(quote, rooms, settings) {
  const quoteRooms = rooms.filter((room) => quote?.roomIds?.includes(room.roomId));
  const labourSubtotal = quoteRooms.reduce((sum, room) => sum + number(room.finalRoomPrice), 0);
  const materialsTotal = quoteRooms.reduce((sum, room) => sum + (room.includeMaterials === "Yes" ? number(room.materialsCost) : 0), 0);
  const beforeDiscount = labourSubtotal + materialsTotal;
  const discountAmount = quote?.discountType === "Custom" ? number(quote.customDiscount) : beforeDiscount * (number(quote?.discountPercent) / 100);
  const afterDiscount = Math.max(0, beforeDiscount - discountAmount);
  const vatAmount = quote?.vatEnabled ? afterDiscount * (number(settings.vatRate) / 100) : 0;
  const total = afterDiscount + vatAmount;
  const deposit = quote?.depositType === "Fixed Amount" || quote?.depositType === "Custom"
    ? number(quote.depositCustom)
    : total * (number(String(quote?.depositType || "0").replace("%", "")) / 100);
  const duration = quoteRooms.reduce((sum, room) => sum + number(room.estimatedDays), 0);
  return {
    rooms: quoteRooms,
    labourSubtotal,
    materialsTotal,
    beforeDiscount,
    discountAmount,
    afterDiscount,
    vatAmount,
    total,
    deposit: Math.min(total, deposit),
    remainder: Math.max(0, total - deposit),
    duration,
    completion: addDays(quote?.proposedStartDate, duration)
  };
}

function generatedRoomDescription(room) {
  const bits = [];
  if (room.ceiling === "Yes") bits.push("ceiling");
  if (room.wallsPaint && room.wallsPaint !== "No") bits.push(`${room.wallsPaint.toLowerCase()} wall painting`);
  if (room.wallpapering && room.wallpapering !== "No") bits.push(`${room.wallpapering.toLowerCase()} wallpapering`);
  ["skirtingBoards", "architrave", "doors"].forEach((key) => {
    if (room[key] && room[key] !== "No") bits.push(key === "skirtingBoards" ? "skirting boards" : key);
  });
  Object.entries(room.otherFeatures || {}).forEach(([key, value]) => {
    if (value && value !== "No") bits.push(key.replace(/([A-Z])/g, " $1").toLowerCase());
  });
  const work = bits.length ? bits.join(", ") : "decorating works";
  return `${room.roomName || "Room"}: ${room.jobType || "Decorating"} including ${work}. ${room.ceilingNotes || ""} ${room.paintNotes || ""} ${room.wallpaperingNotes || ""} ${room.woodworkNotes || ""} ${room.otherNotes || ""}`.replace(/\s+/g, " ").trim();
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
  const uid = `${entry.calendarEntryId}@auty-decorating`;
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AUTY Decorating//Workspace MVP//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(today())}T090000Z`,
    `DTSTART;VALUE=DATE:${toIcsDate(entry.startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDays(entry.endDate || entry.startDate, 2))}`,
    `SUMMARY:${entry.title}`,
    `DESCRIPTION:${entry.type} - ${entry.notes || ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  downloadText(`${entry.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`, content, "text/calendar");
}

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function App() {
  const [data, setData] = useState(loadData);
  const [active, setActive] = useState("Dashboard");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedClient = data.clients.find((client) => client.clientId === selectedClientId) || data.clients[0];
  const selectedQuote = data.quotes.find((quote) => quote.quoteId === selectedQuoteId) || data.quotes.find((quote) => quote.clientId === selectedClient?.clientId);

  const update = (key, updater) => setData((current) => ({ ...current, [key]: typeof updater === "function" ? updater(current[key], current) : updater }));
  const upsert = (key, item, idField) => update(key, (items) => items.some((existing) => existing[idField] === item[idField]) ? items.map((existing) => existing[idField] === item[idField] ? item : existing) : [item, ...items]);

  const createClient = (seed = {}) => {
    const client = { clientId: id("client"), name: "New Client", address: "", contactDetails: "", telephone: "", email: "", notes: "", createdDate: today(), ...seed };
    upsert("clients", client, "clientId");
    setSelectedClientId(client.clientId);
    setActive("Client Profile");
    setNotice("Client created");
    return client;
  };

  const createQuote = (clientId = selectedClient?.clientId) => {
    if (!clientId) {
      const client = createClient();
      clientId = client.clientId;
    }
    const quote = {
      quoteId: id("quote"),
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
      vatEnabled: data.settings.vatEnabled,
      discountType: "No Discount",
      discountPercent: 0,
      customDiscount: 0,
      wholeJobSpecifics: "",
      finalNotes: "",
      roomIds: []
    };
    upsert("quotes", quote, "quoteId");
    setSelectedQuoteId(quote.quoteId);
    setSelectedClientId(clientId);
    setActive("AUTY Job Quoter");
    setNotice("Quote draft created");
    return quote;
  };

  const saveQuoteTotals = (quote) => {
    const calc = calculateQuote(quote, data.rooms, data.settings);
    const updated = {
      ...quote,
      estimatedDuration: calc.duration,
      estimatedCompletionDate: calc.completion,
      depositAmount: calc.deposit,
      totalAmount: calc.total,
      vatAmount: calc.vatAmount
    };
    upsert("quotes", updated, "quoteId");
    return updated;
  };

  const generatePdf = (kind, quote, invoice) => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF || !quote) return setNotice("PDF library unavailable");
    const client = data.clients.find((item) => item.clientId === quote.clientId);
    const calc = calculateQuote(quote, data.rooms, data.settings);
    const doc = new jsPDF();
    let y = 18;
    const line = (text, size = 10, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const split = doc.splitTextToSize(String(text || ""), 180);
      doc.text(split, 15, y);
      y += split.length * (size * 0.45) + 4;
      if (y > 270) { doc.addPage(); y = 18; }
    };
    line(data.settings.businessName || "AUTY Decorating", 20, true);
    line(kind === "quote" ? `Quotation ${quote.quoteReference}` : `Invoice ${invoice.invoiceReference}`, 14, true);
    line(`${client?.name || "Client"} | ${client?.address || "Address not set"}`);
    line(kind === "quote" ? `Quote date: ${dateLabel(quote.quoteDate)} | Start: ${dateLabel(quote.proposedStartDate)} | Duration: ${calc.duration} days` : `Original quote: ${quote.quoteReference} | Payment due: ${dateLabel(invoice.paymentDueDate)}`);
    line("Room-by-room breakdown", 13, true);
    calc.rooms.forEach((room) => line(`${room.roomName} - ${room.jobType} - ${room.estimatedDays} days - ${money(room.finalRoomPrice)}. ${room.generatedDescription}`));
    line("Materials and specifics", 13, true);
    calc.rooms.forEach((room) => room.materials && line(`${room.roomName}: ${room.materials} ${room.includeMaterials === "Yes" ? `(included: ${money(room.materialsCost)})` : "(not included)"}`));
    line(quote.wholeJobSpecifics || "Whole job specifics to be confirmed.");
    line("Price summary", 13, true);
    line(`Labour subtotal: ${money(calc.labourSubtotal)}`);
    line(`Materials total: ${money(calc.materialsTotal)}`);
    line(`Discount: ${money(calc.discountAmount)}`);
    line(`VAT: ${money(calc.vatAmount)}`);
    line(`Total: ${money(calc.total)}`, 12, true);
    line(`Deposit due now: ${money(calc.deposit)} | Remainder due on completion: ${money(calc.remainder)}`);
    if (kind === "invoice") {
      line(`Deposit paid: ${money(invoice.depositPaid)} | Balance due: ${money(invoice.balanceDue)}`, 12, true);
      line(`Payment details: ${data.settings.paymentDetails}`);
    }
    line("Terms and notes", 13, true);
    line(kind === "quote" ? "This quotation is valid for 30 days. Acceptance confirms permission to schedule the works and order agreed materials." : "Thank you for your business. Please arrange payment by the due date shown above.");
    if (kind === "quote") {
      y += 10;
      line("Acceptance: _________________________  Date: _________________________");
    }
    doc.save(kind === "quote" ? `${quote.quoteReference}.pdf` : `${invoice.invoiceReference}.pdf`);
  };

  const nav = [
    ["Dashboard", LayoutDashboard],
    ["Business Calendar", CalendarDays],
    ["Client Database", Users],
    ["Client Profile", Home],
    ["AUTY Job Quoter", ClipboardList],
    ["Quotation Overview", FileText],
    ["Invoice Generator", PoundSterling],
    ["Photos and Attachments", Camera],
    ["Settings", SettingsIcon]
  ];

  const pageProps = { data, update, upsert, createClient, createQuote, selectedClient, selectedQuote, setSelectedClientId, setSelectedQuoteId, setActive, saveQuoteTotals, generatePdf, setNotice };

  return h("div", { className: "min-h-screen bg-auty-cream" },
    h("div", { className: "sticky top-0 z-30 border-b border-auty-line bg-auty-paper/95 backdrop-blur" },
      h("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3" },
        h("div", null,
          h("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-auty-gold" }, "AUTY Decorating Workspace"),
          h("div", { className: "flex flex-wrap items-center gap-2" },
            h("h1", { className: "text-xl font-bold text-auty-ink" }, active),
            h("span", { className: "rounded bg-auty-gold/15 px-2 py-1 text-xs font-black text-auty-gold" }, "Regenerated MVP")
          )
        ),
        h("button", { onClick: () => createQuote(), className: "rounded-md bg-auty-gold px-4 py-3 text-sm font-bold text-white shadow-sm" }, "Create Quote")
      ),
      h("nav", { className: "mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3" },
        nav.map(([name, Icon]) => h("button", {
          key: name,
          onClick: () => setActive(name),
          className: classNames("flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold", active === name ? "bg-auty-ink text-white" : "bg-white text-auty-ink ring-1 ring-auty-line")
        }, h(Icon, { size: 17 }), name))
      )
    ),
    notice && h("div", { className: "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-auty-ink px-4 py-3 text-sm font-semibold text-white shadow-lg" }, notice),
    h("main", { className: "mx-auto max-w-7xl px-4 py-5" },
      active === "Dashboard" && h(Dashboard, pageProps),
      active === "Business Calendar" && h(CalendarPage, pageProps),
      active === "Client Database" && h(ClientDatabase, pageProps),
      active === "Client Profile" && h(ClientProfile, pageProps),
      active === "AUTY Job Quoter" && h(QuoteBuilder, pageProps),
      active === "Quotation Overview" && h(QuoteOverview, pageProps),
      active === "Invoice Generator" && h(InvoiceGenerator, pageProps),
      active === "Photos and Attachments" && h(PhotosPage, pageProps),
      active === "Settings" && h(SettingsPage, pageProps)
    )
  );
}

function Button({ children, onClick, variant = "primary", type = "button", className = "" }) {
  const styles = variant === "secondary" ? "bg-white text-auty-ink ring-1 ring-auty-line" : variant === "danger" ? "bg-auty-red text-white" : "bg-auty-ink text-white";
  return h("button", { type, onClick, className: classNames("inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold shadow-sm", styles, className) }, children);
}

function Field({ label, value, onChange, type = "text", options, textarea, placeholder, required }) {
  const inputClass = "mt-1 w-full rounded-md border border-auty-line bg-white px-3 py-3 text-sm outline-none focus:border-auty-gold";
  const normalisedOptions = options?.map((option) => typeof option === "object" ? option : { value: option, label: option });
  return h("label", { className: "block text-sm font-semibold text-auty-ink" },
    label, required && h("span", { className: "text-auty-red" }, " *"),
    options ? h("select", { value: value ?? "", onChange: (e) => onChange(e.target.value), className: inputClass }, normalisedOptions.map((option) => h("option", { key: option.value || "empty", value: option.value }, option.label)))
      : textarea ? h("textarea", { value: value ?? "", onChange: (e) => onChange(e.target.value), placeholder, rows: 3, className: inputClass })
      : h("input", { value: value ?? "", onChange: (e) => onChange(type === "number" ? number(e.target.value) : e.target.value), type, placeholder, step: type === "number" ? "0.5" : undefined, className: inputClass })
  );
}

function Empty({ title, action }) {
  return h("div", { className: "rounded-md border border-dashed border-auty-line bg-white p-6 text-center" },
    h("p", { className: "font-bold" }, title),
    action && h("div", { className: "mt-3" }, action)
  );
}

function Card({ title, value, tone = "ink" }) {
  const tones = { green: "text-auty-green", amber: "text-auty-amber", red: "text-auty-red", ink: "text-auty-ink" };
  return h("div", { className: "rounded-lg border border-auty-line bg-auty-paper p-4 shadow-sm" },
    h("p", { className: "text-sm font-semibold text-slate-500" }, title),
    h("p", { className: classNames("mt-2 text-3xl font-black", tones[tone]) }, value)
  );
}

function Dashboard({ data, createClient, createQuote, setActive }) {
  const upcoming = data.calendarEntries.filter((e) => e.type === "Confirmed Job" && e.startDate >= today()).length;
  const awaiting = data.quotes.filter((q) => q.quoteStatus === "Awaiting Approval" || q.quoteStatus === "Sent").length;
  const deposits = data.quotes.filter((q) => number(q.depositAmount) > 0 && q.quoteStatus !== "Paid").length;
  const progress = data.quotes.filter((q) => q.quoteStatus === "In Progress").length;
  const invoicesDue = data.invoices.filter((i) => i.invoiceStatus !== "Paid").length;
  const blocked = data.calendarEntries.filter((e) => e.type === "Personal / Blocked Time").length;
  const recentQuotes = data.quotes.slice(0, 4);
  const nextEntries = data.calendarEntries.filter((e) => e.startDate >= today()).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 4);
  return h("div", { className: "space-y-5" },
    h(StartJobPanel, { createClient, createQuote }),
    h("section", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
      h(Card, { title: "Upcoming Jobs", value: upcoming, tone: "green" }),
      h(Card, { title: "Quotes Awaiting Approval", value: awaiting, tone: "amber" }),
      h(Card, { title: "Deposits Due", value: deposits, tone: "red" }),
      h(Card, { title: "Jobs In Progress", value: progress, tone: "green" }),
      h(Card, { title: "Invoices Due", value: invoicesDue, tone: "red" }),
      h(Card, { title: "Blocked Dates", value: blocked, tone: "ink" })
    ),
    h("section", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
      h("h2", { className: "text-lg font-black" }, "Quick Actions"),
      h("div", { className: "mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" },
        h(Button, { onClick: () => createClient() }, h(Users, { size: 18 }), "Add Client"),
        h(Button, { onClick: () => createQuote() }, h(ClipboardList, { size: 18 }), "Create Quote"),
        h(Button, { onClick: () => setActive("Business Calendar"), variant: "secondary" }, h(CalendarDays, { size: 18 }), "Block Date"),
        h(Button, { onClick: () => setActive("Invoice Generator"), variant: "secondary" }, h(PoundSterling, { size: 18 }), "Generate Invoice"),
        h(Button, { onClick: () => setActive("Photos and Attachments"), variant: "secondary" }, h(ImagePlus, { size: 18 }), "Upload Photos")
      )
    ),
    h("section", { className: "grid gap-4 lg:grid-cols-2" },
      h("div", { className: "rounded-lg border border-auty-line bg-white p-4" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("h2", { className: "text-lg font-black" }, "Recent Quotations"),
          h(Button, { onClick: () => setActive("Quotation Overview"), variant: "secondary" }, "Open")
        ),
        recentQuotes.length ? h("div", { className: "mt-3 space-y-2" }, recentQuotes.map((quote) => h("div", { key: quote.quoteId, className: "flex items-center justify-between gap-3 rounded-md bg-auty-cream p-3 text-sm" },
          h("div", null, h("p", { className: "font-black" }, quote.quoteReference), h("p", { className: "text-slate-600" }, quote.quoteStatus)),
          h("strong", null, money(quote.totalAmount))
        ))) : h("p", { className: "mt-3 text-sm text-slate-500" }, "No quotations yet.")
      ),
      h("div", { className: "rounded-lg border border-auty-line bg-white p-4" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("h2", { className: "text-lg font-black" }, "Next Calendar Items"),
          h(Button, { onClick: () => setActive("Business Calendar"), variant: "secondary" }, "Open")
        ),
        nextEntries.length ? h("div", { className: "mt-3 space-y-2" }, nextEntries.map((entry) => h("div", { key: entry.calendarEntryId, className: "rounded-md bg-auty-cream p-3 text-sm" },
          h("p", { className: "font-black" }, entry.title),
          h("p", { className: "text-slate-600" }, `${entry.type} | ${dateLabel(entry.startDate)}`)
        ))) : h("p", { className: "mt-3 text-sm text-slate-500" }, "No upcoming calendar entries.")
      )
    ),
    data.quotes.length === 0 && h(Empty, { title: "No quotes yet. Create a client and start the first room-by-room quotation.", action: h(Button, { onClick: () => createQuote() }, "Create Quote") })
  );
}

function StartJobPanel({ createClient, createQuote }) {
  const [job, setJob] = useState({ name: "", address: "", telephone: "", email: "" });
  const start = () => {
    const client = createClient({
      name: job.name || "New Client",
      address: job.address,
      telephone: job.telephone,
      email: job.email
    });
    createQuote(client.clientId);
    setJob({ name: "", address: "", telephone: "", email: "" });
  };
  return h("section", { className: "rounded-lg border border-auty-line bg-auty-ink p-4 text-white shadow-sm" },
    h("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end" },
      h("div", { className: "grow" },
        h("p", { className: "text-sm font-bold uppercase tracking-[0.16em] text-auty-gold" }, "Fast start"),
        h("h2", { className: "mt-1 text-2xl font-black" }, "Create a client and quote in one go"),
        h("p", { className: "mt-1 text-sm text-white/75" }, "Built for quick use between site visits. Add the basics now and fill the details later.")
      ),
      h("div", { className: "grid grow gap-2 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4" },
        h("input", { value: job.name, onChange: (e) => setJob({ ...job, name: e.target.value }), placeholder: "Client name", className: "rounded-md border border-white/20 bg-white px-3 py-3 text-sm text-auty-ink outline-none" }),
        h("input", { value: job.address, onChange: (e) => setJob({ ...job, address: e.target.value }), placeholder: "Job address", className: "rounded-md border border-white/20 bg-white px-3 py-3 text-sm text-auty-ink outline-none" }),
        h("input", { value: job.telephone, onChange: (e) => setJob({ ...job, telephone: e.target.value }), placeholder: "Telephone", className: "rounded-md border border-white/20 bg-white px-3 py-3 text-sm text-auty-ink outline-none" }),
        h("button", { onClick: start, className: "rounded-md bg-auty-gold px-4 py-3 text-sm font-black text-white" }, "Start Job")
      )
    )
  );
}

function ClientDatabase({ data, upsert, createClient, setSelectedClientId, setActive }) {
  const [query, setQuery] = useState("");
  const haystack = (client) => {
    const quotes = data.quotes.filter((q) => q.clientId === client.clientId);
    const invoices = data.invoices.filter((i) => i.clientId === client.clientId);
    return [client.name, client.address, client.telephone, client.email, client.notes, ...quotes.map((q) => `${q.quoteReference} ${q.finalNotes}`), ...invoices.map((i) => i.invoiceReference)].join(" ").toLowerCase();
  };
  const clients = data.clients.filter((client) => haystack(client).includes(query.toLowerCase()));
  return h("div", { className: "space-y-4" },
    h("div", { className: "flex flex-col gap-3 rounded-lg border border-auty-line bg-auty-paper p-4 sm:flex-row sm:items-end" },
      h("div", { className: "grow" }, h(Field, { label: "Search", value: query, onChange: setQuery, placeholder: "Name, address, telephone, email, job type, quote reference, invoice reference or notes" })),
      h(Button, { onClick: () => createClient() }, h(Users, { size: 18 }), "Add Client")
    ),
    clients.length === 0 ? h(Empty, { title: "No clients match that search." }) : h("div", { className: "grid gap-3 lg:grid-cols-2" },
      clients.map((client) => h("article", { key: client.clientId, className: "rounded-lg border border-auty-line bg-white p-4" },
        h("div", { className: "flex items-start justify-between gap-3" },
          h("div", null, h("h3", { className: "text-lg font-black" }, client.name), h("p", { className: "text-sm text-slate-600" }, client.address || "No address yet"), h("p", { className: "mt-1 text-sm" }, client.telephone, client.telephone && client.email ? " | " : "", client.email)),
          h(Button, { onClick: () => { setSelectedClientId(client.clientId); setActive("Client Profile"); }, variant: "secondary" }, "Open")
        ),
        h("div", { className: "mt-3 grid gap-2 sm:grid-cols-2" },
          ["name", "address", "telephone", "email"].map((field) => h(Field, { key: field, label: field[0].toUpperCase() + field.slice(1), value: client[field], onChange: (value) => upsert("clients", { ...client, [field]: value }, "clientId") }))
        )
      ))
    )
  );
}

function ClientProfile(props) {
  const { data, upsert, createQuote, selectedClient, setActive, setSelectedQuoteId, setNotice } = props;
  if (!selectedClient) return h(Empty, { title: "No client selected.", action: h(Button, { onClick: () => props.createClient() }, "Add Client") });
  const quotes = data.quotes.filter((q) => q.clientId === selectedClient.clientId);
  const invoices = data.invoices.filter((i) => i.clientId === selectedClient.clientId);
  const photos = data.photos.filter((p) => p.clientId === selectedClient.clientId);
  const latestQuote = quotes[0];
  const calc = latestQuote ? calculateQuote(latestQuote, data.rooms, data.settings) : null;
  return h("div", { className: "grid gap-4 lg:grid-cols-[1fr_360px]" },
    h("section", { className: "space-y-4 rounded-lg border border-auty-line bg-auty-paper p-4" },
      h("h2", { className: "text-xl font-black" }, selectedClient.name),
      h("div", { className: "grid gap-3 sm:grid-cols-2" },
        h(Field, { label: "Name", value: selectedClient.name, required: true, onChange: (value) => upsert("clients", { ...selectedClient, name: value }, "clientId") }),
        h(Field, { label: "Telephone", value: selectedClient.telephone, onChange: (value) => upsert("clients", { ...selectedClient, telephone: value }, "clientId") }),
        h(Field, { label: "Email", value: selectedClient.email, onChange: (value) => upsert("clients", { ...selectedClient, email: value }, "clientId") }),
        h(Field, { label: "Contact Details", value: selectedClient.contactDetails, onChange: (value) => upsert("clients", { ...selectedClient, contactDetails: value }, "clientId") }),
        h("div", { className: "sm:col-span-2" }, h(Field, { label: "Address", value: selectedClient.address, textarea: true, onChange: (value) => upsert("clients", { ...selectedClient, address: value }, "clientId") })),
        h("div", { className: "sm:col-span-2" }, h(Field, { label: "Final Notes from Client", value: selectedClient.notes, textarea: true, onChange: (value) => upsert("clients", { ...selectedClient, notes: value }, "clientId") }))
      ),
      latestQuote && h("div", { className: "rounded-md bg-white p-4 ring-1 ring-auty-line" },
        h("h3", { className: "font-black" }, "Current Job Summary"),
        h("dl", { className: "mt-2 grid gap-2 text-sm sm:grid-cols-2" },
          h("div", null, h("dt", { className: "font-bold" }, "Proposed Start Date"), h("dd", null, dateLabel(latestQuote.proposedStartDate))),
          h("div", null, h("dt", { className: "font-bold" }, "Estimated Job Duration"), h("dd", null, `${calc.duration} days`)),
          h("div", null, h("dt", { className: "font-bold" }, "Estimated Completion Date"), h("dd", null, dateLabel(calc.completion))),
          h("div", null, h("dt", { className: "font-bold" }, "Job Quote"), h("dd", null, money(calc.total))),
          h("div", null, h("dt", { className: "font-bold" }, "Deposit Due Now"), h("dd", null, money(calc.deposit))),
          h("div", null, h("dt", { className: "font-bold" }, "Remainder Due on Completion"), h("dd", null, money(calc.remainder)))
        ),
        h("p", { className: "mt-3 text-sm" }, latestQuote.wholeJobSpecifics || "Whole job specifics will auto-populate from completed rooms.")
      )
    ),
    h("aside", { className: "space-y-3" },
      h("div", { className: "rounded-lg border border-auty-line bg-white p-4" },
        h("h3", { className: "font-black" }, "Actions"),
        h("div", { className: "mt-3 grid gap-2" },
          h(Button, { onClick: () => createQuote(selectedClient.clientId) }, "Create New Quote"),
          latestQuote && h(Button, { onClick: () => { setSelectedQuoteId(latestQuote.quoteId); setActive("Quotation Overview"); }, variant: "secondary" }, "View Quote"),
          latestQuote && h(Button, { onClick: () => { setSelectedQuoteId(latestQuote.quoteId); setActive("Invoice Generator"); }, variant: "secondary" }, "Generate Final Invoice"),
          h(Button, { onClick: () => setActive("Photos and Attachments"), variant: "secondary" }, "Upload Photos"),
          latestQuote && h(Button, { onClick: () => { const entry = { calendarEntryId: id("cal"), clientId: selectedClient.clientId, quoteId: latestQuote.quoteId, title: `${selectedClient.name} decorating job`, type: "Proposed Job", startDate: latestQuote.proposedStartDate || today(), endDate: calc.completion || today(), notes: latestQuote.quoteReference }; upsert("calendarEntries", entry, "calendarEntryId"); setNotice("Calendar booking added"); }, variant: "secondary" }, "Add Calendar Booking"),
          latestQuote && h(Button, { onClick: () => upsert("quotes", { ...latestQuote, quoteStatus: "Complete" }, "quoteId") }, h(CheckCircle2, { size: 18 }), "Mark Job Complete")
        )
      ),
      h(RelatedList, { title: "Related quotes", items: quotes.map((q) => q.quoteReference) }),
      h(RelatedList, { title: "Related invoices", items: invoices.map((i) => i.invoiceReference) }),
      h(RelatedList, { title: "Related photos", items: photos.map((p) => p.caption || p.photoType) })
    )
  );
}

function RelatedList({ title, items }) {
  return h("div", { className: "rounded-lg border border-auty-line bg-white p-4" },
    h("h3", { className: "font-black" }, title),
    items.length ? h("ul", { className: "mt-2 space-y-1 text-sm" }, items.map((item) => h("li", { key: item }, item))) : h("p", { className: "mt-2 text-sm text-slate-500" }, "Nothing here yet.")
  );
}

function QuoteBuilder({ data, upsert, selectedClient, selectedQuote, createQuote, saveQuoteTotals, setNotice }) {
  const quote = selectedQuote || null;
  const newRoomDraft = (quoteId) => ({
    roomId: id("room"),
    quoteId,
    roomName: "Living Room",
    jobType: "Painting",
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
    otherFeatures: { dadoRails: "No", pictureRails: "No", radiators: "No", windowSill: "No", banister: "No", spindles: "No", stairs: "No", floor: "No", other: "No" },
    otherNotes: "",
    paintSpecifics: "",
    materials: "",
    materialsSuppliedBy: "Decorator",
    materialsCost: 0,
    includeMaterials: "Yes",
    estimatedDays: 1,
    pricingAdjustment: "Normal",
    overridePrice: "",
    generatedDescription: "",
    notes: ""
  });
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    setDraft(newRoomDraft(quote?.quoteId));
  }, [quote?.quoteId]);
  if (!quote) return h(Empty, { title: "Every quote needs a client. Create a quote to begin.", action: h(Button, { onClick: () => createQuote(selectedClient?.clientId) }, "Create Quote") });
  if (!draft) return null;
  const factor = draft.pricingAdjustment === "+10%" ? 1.1 : draft.pricingAdjustment === "+20%" ? 1.2 : draft.pricingAdjustment === "+30%" ? 1.3 : 1;
  const autoPrice = number(draft.estimatedDays) * number(data.settings.dayRate) * factor;
  const finalRoomPrice = draft.overridePrice !== "" ? number(draft.overridePrice) : autoPrice;
  const description = draft.generatedDescription || generatedRoomDescription(draft);
  const quoteRooms = data.rooms.filter((room) => quote.roomIds.includes(room.roomId));
  const patch = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const completeRoom = () => {
    if (!draft.roomName || !draft.jobType || !draft.estimatedDays) return setNotice("Room, job type and time estimate are required");
    const room = { ...draft, generatedDescription: description, autoPrice, finalRoomPrice };
    upsert("rooms", room, "roomId");
    const updatedQuote = { ...quote, roomIds: Array.from(new Set([...(quote.roomIds || []), room.roomId])), wholeJobSpecifics: [quote.wholeJobSpecifics, room.generatedDescription].filter(Boolean).join("\n") };
    saveQuoteTotals(updatedQuote);
    setNotice("Room saved to quote");
    setDraft(newRoomDraft(quote.quoteId));
  };
  return h("div", { className: "grid gap-4 lg:grid-cols-[1fr_340px]" },
    h("section", { className: "space-y-4 rounded-lg border border-auty-line bg-auty-paper p-4" },
      h("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
        h("div", null,
          h("h2", { className: "text-xl font-black" }, "AUTY Job Quoter"),
          h("p", { className: "text-sm text-slate-600" }, `${selectedClient?.name || "Client"} | ${quote.quoteReference}`),
          h("p", { className: "mt-1 text-sm font-semibold text-auty-green" }, "Completing a room saves it and clears the form ready for the next room.")
        ),
        h(Button, { onClick: completeRoom }, h(Save, { size: 18 }), "Complete Room")
      ),
      h("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
        h(Field, { label: "Room", value: draft.roomName, options: ROOM_NAMES, onChange: (v) => patch("roomName", v), required: true }),
        h(Field, { label: "Job Type", value: draft.jobType, options: JOB_TYPES, onChange: (v) => patch("jobType", v), required: true }),
        h(Field, { label: "Ceiling", value: draft.ceiling, options: ["Yes", "No"], onChange: (v) => patch("ceiling", v) }),
        h("div", { className: "lg:col-span-3" }, h(Field, { label: "Ceiling Notes", value: draft.ceilingNotes, textarea: true, onChange: (v) => patch("ceilingNotes", v) })),
        h(Field, { label: "Paint", value: draft.wallsPaint, options: YES_NO_PARTIAL, onChange: (v) => patch("wallsPaint", v) }),
        h(Field, { label: "Wallpapering", value: draft.wallpapering, options: YES_NO_PARTIAL, onChange: (v) => patch("wallpapering", v) }),
        h(Field, { label: "Paint Notes", value: draft.paintNotes, textarea: true, onChange: (v) => patch("paintNotes", v) }),
        h(Field, { label: "Wallpapering Notes", value: draft.wallpaperingNotes, textarea: true, onChange: (v) => patch("wallpaperingNotes", v) }),
        h(Field, { label: "Skirting Boards", value: draft.skirtingBoards, options: YES_NO_PARTIAL, onChange: (v) => patch("skirtingBoards", v) }),
        h(Field, { label: "Architrave", value: draft.architrave, options: YES_NO_PARTIAL, onChange: (v) => patch("architrave", v) }),
        h(Field, { label: "Doors", value: draft.doors, options: YES_NO_PARTIAL, onChange: (v) => patch("doors", v) }),
        h("div", { className: "lg:col-span-3" }, h(Field, { label: "Woodwork Notes", value: draft.woodworkNotes, textarea: true, onChange: (v) => patch("woodworkNotes", v) }))
      ),
      h("div", { className: "rounded-md bg-white p-4 ring-1 ring-auty-line" },
        h("h3", { className: "font-black" }, "Other Features"),
        h("div", { className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
          Object.keys(draft.otherFeatures).map((key) => h(Field, { key, label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace("Window Sill", "Window Sill"), value: draft.otherFeatures[key], options: YES_NO_PARTIAL, onChange: (v) => patch("otherFeatures", { ...draft.otherFeatures, [key]: v }) })),
          h("div", { className: "sm:col-span-2 lg:col-span-3" }, h(Field, { label: "Other Notes", value: draft.otherNotes, textarea: true, onChange: (v) => patch("otherNotes", v) }))
        )
      ),
      h("div", { className: "grid gap-3 sm:grid-cols-2" },
        h(Field, { label: "General Job Description", value: description, textarea: true, onChange: (v) => patch("generatedDescription", v) }),
        h(Field, { label: "Paint Specifics", value: draft.paintSpecifics, textarea: true, onChange: (v) => patch("paintSpecifics", v) }),
        h(Field, { label: "Materials", value: draft.materials, textarea: true, onChange: (v) => patch("materials", v) }),
        h(Field, { label: "Materials Supplied By", value: draft.materialsSuppliedBy, options: ["Decorator", "Client", "Mixed"], onChange: (v) => patch("materialsSuppliedBy", v) }),
        h(Field, { label: "Materials Cost", value: draft.materialsCost, type: "number", onChange: (v) => patch("materialsCost", v) }),
        h(Field, { label: "Include Materials in Quote", value: draft.includeMaterials, options: ["Yes", "No"], onChange: (v) => patch("includeMaterials", v) }),
        h(Field, { label: "Room Estimate Time in 0.5 day increments", value: draft.estimatedDays, type: "number", onChange: (v) => patch("estimatedDays", Math.round(number(v) * 2) / 2) }),
        h(Field, { label: "Pricing Adjustment", value: draft.pricingAdjustment, options: ["Normal", "+10%", "+20%", "+30%"], onChange: (v) => patch("pricingAdjustment", v) }),
        h(Field, { label: "Auto Price", value: autoPrice, type: "number", onChange: () => null }),
        h(Field, { label: "Override Price", value: draft.overridePrice, type: "number", onChange: (v) => patch("overridePrice", v) }),
        h("div", { className: "rounded-md bg-auty-ink p-4 text-white" }, h("p", { className: "text-sm font-semibold" }, "Final Room Price"), h("p", { className: "text-3xl font-black" }, money(finalRoomPrice)))
      )
    ),
    h("aside", { className: "space-y-3 lg:sticky lg:top-32 lg:self-start" },
      h("div", { className: "rounded-lg border border-auty-line bg-white p-4" },
        h("h3", { className: "font-black" }, "Rooms in Quote"),
        quoteRooms.length ? h("div", { className: "mt-3 space-y-2" }, quoteRooms.map((room) => h("div", { key: room.roomId, className: "rounded-md bg-auty-cream p-3 text-sm" }, h("strong", null, room.roomName), h("span", null, ` | ${room.estimatedDays} days | ${money(room.finalRoomPrice)}`)))) : h("p", { className: "mt-2 text-sm text-slate-500" }, "No rooms added yet."),
        h(Button, { onClick: completeRoom, className: "mt-3 w-full" }, "ADD ROOM +")
      )
    )
  );
}

function QuoteOverview({ data, upsert, selectedClient, selectedQuote, saveQuoteTotals, generatePdf, setNotice }) {
  if (!selectedQuote) return h(Empty, { title: "Select or create a quote first." });
  const calc = calculateQuote(selectedQuote, data.rooms, data.settings);
  const updateQuote = (patch) => saveQuoteTotals({ ...selectedQuote, ...patch });
  const updateRoom = (room, patch) => {
    const updated = { ...room, ...patch };
    updated.finalRoomPrice = updated.overridePrice !== "" && updated.overridePrice !== null ? number(updated.overridePrice) : number(updated.autoPrice);
    upsert("rooms", updated, "roomId");
    setNotice("Room price updated");
  };
  return h("div", { className: "grid gap-4 lg:grid-cols-[1fr_340px]" },
    h("section", { className: "space-y-4" },
      h("div", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
        h("h2", { className: "text-xl font-black" }, "Quotation Overview"),
        h("div", { className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
          h(Field, { label: "Client name", value: selectedClient?.name || "", onChange: () => null }),
          h(Field, { label: "Client address", value: selectedClient?.address || "", onChange: () => null }),
          h(Field, { label: "Quote reference", value: selectedQuote.quoteReference, onChange: (v) => updateQuote({ quoteReference: v }) }),
          h(Field, { label: "Quote date", value: selectedQuote.quoteDate, type: "date", onChange: (v) => updateQuote({ quoteDate: v }) }),
          h(Field, { label: "Proposed start date", value: selectedQuote.proposedStartDate, type: "date", onChange: (v) => updateQuote({ proposedStartDate: v, estimatedCompletionDate: addDays(v, calc.duration) }) }),
          h(Field, { label: "Quote status", value: selectedQuote.quoteStatus, options: STATUSES, onChange: (v) => updateQuote({ quoteStatus: v }) })
        )
      ),
      h("div", { className: "overflow-x-auto rounded-lg border border-auty-line bg-white" },
        h("table", { className: "w-full min-w-[860px] text-left text-sm" },
          h("thead", { className: "bg-auty-ink text-white" }, h("tr", null, ["Room", "Job Type", "Time", "Pricing Adjustment", "Auto Price", "Override Price", "Final Room Price"].map((head) => h("th", { key: head, className: "px-3 py-3" }, head)))),
          h("tbody", null, calc.rooms.map((room) => h("tr", { key: room.roomId, className: "border-t border-auty-line" },
            h("td", { className: "px-3 py-3 font-bold" }, room.roomName),
            h("td", { className: "px-3 py-3" }, room.jobType),
            h("td", { className: "px-3 py-3" }, `${room.estimatedDays} days`),
            h("td", { className: "px-3 py-3" }, room.pricingAdjustment),
            h("td", { className: "px-3 py-3" }, money(room.autoPrice)),
            h("td", { className: "px-3 py-3" }, h("input", { className: "w-28 rounded-md border border-auty-line px-2 py-2", type: "number", value: room.overridePrice ?? "", onChange: (e) => updateRoom(room, { overridePrice: e.target.value }) })),
            h("td", { className: "px-3 py-3 font-black" }, money(room.finalRoomPrice))
          )))
        )
      ),
      calc.rooms.length === 0 && h(Empty, { title: "No rooms in this quote yet. Add rooms in AUTY Job Quoter." }),
      h("div", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
        h("h3", { className: "font-black" }, "Payment and Notes"),
        h("div", { className: "mt-3 grid gap-3 sm:grid-cols-2" },
          h(Field, { label: "Overall discount", value: selectedQuote.discountType, options: ["No Discount", "5%", "10%", "15%", "20%", "Custom"], onChange: (v) => updateQuote({ discountType: v, discountPercent: v === "No Discount" || v === "Custom" ? 0 : number(v.replace("%", "")) }) }),
          selectedQuote.discountType === "Custom" && h(Field, { label: "Custom discount amount", value: selectedQuote.customDiscount, type: "number", onChange: (v) => updateQuote({ customDiscount: v }) }),
          h(Field, { label: "VAT", value: selectedQuote.vatEnabled ? "Enabled" : "Disabled", options: ["Enabled", "Disabled"], onChange: (v) => updateQuote({ vatEnabled: v === "Enabled" }) }),
          h(Field, { label: "Deposit due now", value: selectedQuote.depositType, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%", "Fixed Amount", "Custom"], onChange: (v) => updateQuote({ depositType: v }) }),
          (selectedQuote.depositType === "Fixed Amount" || selectedQuote.depositType === "Custom") && h(Field, { label: "Deposit amount", value: selectedQuote.depositCustom, type: "number", onChange: (v) => updateQuote({ depositCustom: v }) }),
          h("div", { className: "sm:col-span-2" }, h(Field, { label: "Whole Job Specifics", value: selectedQuote.wholeJobSpecifics, textarea: true, onChange: (v) => updateQuote({ wholeJobSpecifics: v }) })),
          h("div", { className: "sm:col-span-2" }, h(Field, { label: "Terms and notes", value: selectedQuote.finalNotes, textarea: true, onChange: (v) => updateQuote({ finalNotes: v }) }))
        )
      )
    ),
    h("aside", { className: "lg:sticky lg:top-32 lg:self-start" },
      h("div", { className: "rounded-lg border border-auty-line bg-white p-4 shadow-sm" },
        h("h3", { className: "text-lg font-black" }, "Quote Total"),
        h("div", { className: "mt-3 space-y-2 text-sm" },
          [["Labour subtotal", calc.labourSubtotal], ["Materials total", calc.materialsTotal], ["Subtotal before discount", calc.beforeDiscount], ["Discount", -calc.discountAmount], ["Subtotal after discount", calc.afterDiscount], ["VAT", calc.vatAmount], ["Job total", calc.total], ["Deposit due now", calc.deposit], ["Remainder due on completion", calc.remainder]].map(([label, value], index) => h("div", { key: label, className: classNames("flex justify-between gap-3", index === 6 && "border-t border-auty-line pt-2 text-base font-black") }, h("span", null, label), h("strong", null, money(value))))
        ),
        h("p", { className: "mt-3 text-sm" }, `Estimated duration: ${calc.duration} days`),
        h("p", { className: "text-sm" }, `Estimated completion date: ${dateLabel(calc.completion)}`),
        h(Button, { onClick: () => generatePdf("quote", selectedQuote), className: "mt-4 w-full" }, h(Download, { size: 18 }), "Generate Quote PDF")
      )
    )
  );
}

function InvoiceGenerator({ data, upsert, selectedQuote, generatePdf, setNotice }) {
  const accepted = data.quotes.filter((q) => q.quoteStatus === "Accepted" || q.quoteStatus === "Complete" || q.quoteStatus === "In Progress");
  const [quoteId, setQuoteId] = useState(selectedQuote?.quoteId || accepted[0]?.quoteId || data.quotes[0]?.quoteId || "");
  useEffect(() => {
    if (selectedQuote?.quoteId) setQuoteId(selectedQuote.quoteId);
  }, [selectedQuote?.quoteId]);
  const quote = data.quotes.find((q) => q.quoteId === quoteId) || selectedQuote || accepted[0] || data.quotes[0];
  const calc = quote ? calculateQuote(quote, data.rooms, data.settings) : null;
  const existing = data.invoices.find((i) => i.quoteId === quote?.quoteId);
  const [draftInvoice, setDraftInvoice] = useState(null);
  useEffect(() => {
    if (!quote || !calc) return;
    setDraftInvoice(existing || {
      invoiceId: id("invoice"),
      clientId: quote.clientId,
      quoteId: quote.quoteId,
      invoiceReference: nextReference("AUTY-INV", data.invoices, "invoiceReference"),
      invoiceDate: today(),
      jobTotal: calc.total,
      depositPaid: calc.deposit,
      balanceDue: Math.max(0, calc.total - calc.deposit),
      paymentDueDate: addDays(today(), 14),
      invoiceStatus: "Invoice Due"
    });
  }, [quote?.quoteId, existing?.invoiceId, calc?.total, calc?.deposit]);
  const makeInvoice = () => {
    if (!quote || !draftInvoice) return;
    const invoice = { ...draftInvoice, jobTotal: calc.total, balanceDue: Math.max(0, calc.total - number(draftInvoice.depositPaid)) };
    upsert("invoices", invoice, "invoiceId");
    setNotice("Invoice saved");
    generatePdf("invoice", quote, invoice);
  };
  if (!quote) return h(Empty, { title: "Create or accept a quote before generating an invoice." });
  const client = data.clients.find((c) => c.clientId === quote.clientId);
  return h("div", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
    h("h2", { className: "text-xl font-black" }, "Final Invoice Generator"),
    h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2" },
      h(Field, { label: "Quote to invoice", value: quote.quoteId, options: data.quotes.map((q) => ({ value: q.quoteId, label: `${q.quoteReference} - ${data.clients.find((c) => c.clientId === q.clientId)?.name || "Client"}` })), onChange: setQuoteId }),
      draftInvoice && h(Field, { label: "Invoice reference", value: draftInvoice.invoiceReference, onChange: (v) => setDraftInvoice({ ...draftInvoice, invoiceReference: v }) }),
      draftInvoice && h(Field, { label: "Payment due date", value: draftInvoice.paymentDueDate, type: "date", onChange: (v) => setDraftInvoice({ ...draftInvoice, paymentDueDate: v }) }),
      draftInvoice && h(Field, { label: "Deposit paid", value: draftInvoice.depositPaid, type: "number", onChange: (v) => setDraftInvoice({ ...draftInvoice, depositPaid: v, balanceDue: Math.max(0, calc.total - number(v)) }) }),
      draftInvoice && h(Field, { label: "Invoice status", value: draftInvoice.invoiceStatus, options: ["Invoice Due", "Part Paid", "Paid", "Overdue"], onChange: (v) => setDraftInvoice({ ...draftInvoice, invoiceStatus: v }) }),
      h("p", null, h("strong", null, "Client: "), client?.name || "Unknown"),
      h("p", null, h("strong", null, "Original quote: "), quote.quoteReference),
      h("p", null, h("strong", null, "Final job total: "), money(calc.total)),
      h("p", null, h("strong", null, "Remaining balance: "), money(draftInvoice?.balanceDue ?? calc.remainder)),
      h("p", null, h("strong", null, "VAT breakdown: "), money(calc.vatAmount)),
      h("p", null, h("strong", null, "Status: "), draftInvoice?.invoiceStatus || "Not generated")
    ),
    h(Button, { onClick: makeInvoice, className: "mt-5" }, h(FileText, { size: 18 }), "Generate Final Invoice")
  );
}

function PhotosPage({ data, upsert, selectedClient, selectedQuote, setNotice }) {
  const [form, setForm] = useState({ clientId: selectedClient?.clientId || "", quoteId: selectedQuote?.quoteId || "", roomId: "", photoType: "Before", caption: "" });
  const rooms = data.rooms.filter((r) => !form.quoteId || r.quoteId === form.quoteId);
  const upload = (file) => {
    if (!file || !form.clientId || !form.quoteId || !form.roomId) return setNotice("Choose client, quote and room before uploading");
    const reader = new FileReader();
    reader.onload = () => {
      upsert("photos", { photoId: id("photo"), ...form, imageData: reader.result, uploadedDate: today() }, "photoId");
      setForm({ ...form, caption: "" });
      setNotice("Photo attached");
    };
    reader.readAsDataURL(file);
  };
  return h("div", { className: "space-y-4" },
    h("section", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
      h("h2", { className: "text-xl font-black" }, "Photos and Attachments"),
      h("div", { className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
        h(Field, { label: "Assigned client", value: form.clientId, options: [{ value: "", label: "Choose client" }, ...data.clients.map((c) => ({ value: c.clientId, label: c.name || "Unnamed client" }))], onChange: (v) => setForm({ ...form, clientId: v }) }),
        h(Field, { label: "Assigned quote/job", value: form.quoteId, options: [{ value: "", label: "Choose quote/job" }, ...data.quotes.filter((q) => !form.clientId || q.clientId === form.clientId).map((q) => ({ value: q.quoteId, label: q.quoteReference }))], onChange: (v) => setForm({ ...form, quoteId: v, roomId: "" }) }),
        h(Field, { label: "Assigned room", value: form.roomId, options: [{ value: "", label: "Choose room" }, ...rooms.map((r) => ({ value: r.roomId, label: r.roomName }))], onChange: (v) => setForm({ ...form, roomId: v }) }),
        h(Field, { label: "Photo type", value: form.photoType, options: PHOTO_TYPES, onChange: (v) => setForm({ ...form, photoType: v }) }),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Caption", value: form.caption, onChange: (v) => setForm({ ...form, caption: v }) })),
        h("label", { className: "flex min-h-28 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-auty-line bg-white p-4 text-center font-bold" },
          h(Upload, { className: "mr-2", size: 20 }), "Upload Photos",
          h("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => upload(e.target.files?.[0]) })
        )
      )
    ),
    data.photos.length === 0 ? h(Empty, { title: "No photos attached yet." }) : h("section", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
      data.photos.map((photo) => {
        const client = data.clients.find((c) => c.clientId === photo.clientId);
        const room = data.rooms.find((r) => r.roomId === photo.roomId);
        return h("article", { key: photo.photoId, className: "overflow-hidden rounded-lg border border-auty-line bg-white" },
          h("img", { src: photo.imageData, alt: photo.caption || photo.photoType, className: "h-52 w-full object-cover" }),
          h("div", { className: "p-3 text-sm" }, h("p", { className: "font-black" }, photo.photoType), h("p", null, photo.caption || "No caption"), h("p", { className: "text-slate-500" }, `${client?.name || "Client"} | ${room?.roomName || "Room"} | ${dateLabel(photo.uploadedDate)}`))
        );
      })
    )
  );
}

function CalendarPage({ data, upsert, setNotice }) {
  const [entry, setEntry] = useState({ title: "", type: "Personal / Blocked Time", startDate: today(), endDate: today(), clientId: "", quoteId: "", notes: "" });
  const colour = { "Confirmed Job": "bg-auty-green", "Proposed Job": "bg-auty-amber", "Personal / Blocked Time": "bg-slate-500", "Quote Visit": "bg-blue-600", "Invoice / Payment Due": "bg-auty-red" };
  const overlaps = data.calendarEntries.some((item) => item.type === "Personal / Blocked Time" && entry.type !== "Personal / Blocked Time" && entry.startDate <= item.endDate && entry.endDate >= item.startDate);
  const add = () => {
    if (!entry.title || !entry.startDate) return setNotice("Title and start date are required");
    upsert("calendarEntries", { ...entry, calendarEntryId: id("cal") }, "calendarEntryId");
    setEntry({ ...entry, title: "", notes: "" });
    setNotice(overlaps ? "Calendar entry saved with overlap warning" : "Calendar entry saved");
  };
  return h("div", { className: "grid gap-4 lg:grid-cols-[360px_1fr]" },
    h("section", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
      h("h2", { className: "text-xl font-black" }, "Business Calendar"),
      h("div", { className: "mt-3 space-y-3" },
        h(Field, { label: "Title", value: entry.title, onChange: (v) => setEntry({ ...entry, title: v }), required: true }),
        h(Field, { label: "Type", value: entry.type, options: CAL_TYPES, onChange: (v) => setEntry({ ...entry, type: v }) }),
        h(Field, { label: "Start date", value: entry.startDate, type: "date", onChange: (v) => setEntry({ ...entry, startDate: v }) }),
        h(Field, { label: "End date", value: entry.endDate, type: "date", onChange: (v) => setEntry({ ...entry, endDate: v }) }),
        h(Field, { label: "Client", value: entry.clientId, options: [{ value: "", label: "No client" }, ...data.clients.map((c) => ({ value: c.clientId, label: c.name || "Unnamed client" }))], onChange: (v) => setEntry({ ...entry, clientId: v }) }),
        h(Field, { label: "Quote/job", value: entry.quoteId, options: [{ value: "", label: "No quote/job" }, ...data.quotes.map((q) => ({ value: q.quoteId, label: q.quoteReference }))], onChange: (v) => {
          const quote = data.quotes.find((q) => q.quoteId === v);
          const client = data.clients.find((c) => c.clientId === quote?.clientId);
          const calc = quote ? calculateQuote(quote, data.rooms, data.settings) : null;
          setEntry({
            ...entry,
            quoteId: v,
            clientId: quote?.clientId || entry.clientId,
            title: quote ? `${client?.name || "Client"} decorating job` : entry.title,
            type: quote ? "Proposed Job" : entry.type,
            startDate: quote?.proposedStartDate || entry.startDate,
            endDate: calc?.completion || entry.endDate,
            notes: quote ? quote.quoteReference : entry.notes
          });
        } }),
        h(Field, { label: "Notes", value: entry.notes, textarea: true, onChange: (v) => setEntry({ ...entry, notes: v }) }),
        overlaps && h("p", { className: "rounded-md bg-red-50 p-3 text-sm font-bold text-auty-red" }, "Warning: this proposed booking overlaps with blocked time."),
        h(Button, { onClick: add }, "Add blocked date or booking")
      )
    ),
    h("section", { className: "space-y-3" },
      data.calendarEntries.length === 0 ? h(Empty, { title: "No calendar entries yet." }) : data.calendarEntries.sort((a, b) => a.startDate.localeCompare(b.startDate)).map((item) => h("article", { key: item.calendarEntryId, className: "rounded-lg border border-auty-line bg-white p-4" },
        h("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" },
          h("div", null, h("span", { className: classNames("inline-block rounded px-2 py-1 text-xs font-bold text-white", colour[item.type]) }, item.type), h("h3", { className: "mt-2 text-lg font-black" }, item.title), h("p", { className: "text-sm text-slate-600" }, `${dateLabel(item.startDate)} to ${dateLabel(item.endDate)}`), item.notes && h("p", { className: "mt-1 text-sm" }, item.notes)),
          h(Button, { onClick: () => exportIcs(item), variant: "secondary" }, h(Download, { size: 18 }), "Export .ics")
        )
      ))
    )
  );
}

function SettingsPage({ data, update, setNotice }) {
  const settings = data.settings;
  const patch = (field, value) => update("settings", { ...settings, [field]: value });
  const backup = () => downloadText(`auty-decorating-backup-${today()}.json`, JSON.stringify(data, null, 2), "application/json");
  const restore = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = JSON.parse(reader.result);
        Object.keys(initialState).forEach((key) => { if (!(key in restored)) restored[key] = initialState[key]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        window.location.reload();
      } catch {
        setNotice("Could not import that backup");
      }
    };
    if (file) reader.readAsText(file);
  };
  return h("div", { className: "rounded-lg border border-auty-line bg-auty-paper p-4" },
    h("h2", { className: "text-xl font-black" }, "Settings"),
    h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2" },
      h(Field, { label: "Business Name", value: settings.businessName, onChange: (v) => patch("businessName", v) }),
      h(Field, { label: "Standard Day Rate", value: settings.dayRate, type: "number", onChange: (v) => patch("dayRate", v) }),
      h(Field, { label: "VAT Enabled", value: settings.vatEnabled ? "Yes" : "No", options: ["Yes", "No"], onChange: (v) => patch("vatEnabled", v === "Yes") }),
      h(Field, { label: "VAT Rate", value: settings.vatRate, type: "number", onChange: (v) => patch("vatRate", v) }),
      h(Field, { label: "Default Deposit", value: settings.defaultDeposit, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%"], onChange: (v) => patch("defaultDeposit", v) }),
      h(Field, { label: "Business Email", value: settings.businessEmail, onChange: (v) => patch("businessEmail", v) }),
      h(Field, { label: "Business Telephone", value: settings.businessTelephone, onChange: (v) => patch("businessTelephone", v) }),
      h("div", { className: "sm:col-span-2" }, h(Field, { label: "Business Address", value: settings.businessAddress, textarea: true, onChange: (v) => patch("businessAddress", v) })),
      h("div", { className: "sm:col-span-2" }, h(Field, { label: "Payment Details", value: settings.paymentDetails, textarea: true, onChange: (v) => patch("paymentDetails", v) }))
    ),
    h("div", { className: "mt-5 flex flex-col gap-2 sm:flex-row" },
      h(Button, { onClick: backup }, h(Download, { size: 18 }), "Export JSON Backup"),
      h("label", { className: "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-auty-ink ring-1 ring-auty-line" }, h(Upload, { size: 18 }), "Import JSON Backup", h("input", { className: "hidden", type: "file", accept: "application/json", onChange: (e) => restore(e.target.files?.[0]) }))
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
