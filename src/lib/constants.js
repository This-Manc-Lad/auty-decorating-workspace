export const STORAGE_KEY = "auty-decorating-mvp-v2";
export const LEGACY_KEYS = ["auty-decorating-mvp-v1"];
export const DAY_RATE = 150;
export const VAT_RATE = 20;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const PHOTO_BUCKET = "auty-media";
export const LOGO_BUCKET_FOLDER = "logos";
export const PHOTO_BUCKET_FOLDER = "photos";

export const MAIN_TABS = ["Dashboard", "Calendar", "Client Database", "Current Job"];
export const JOB_TABS = ["Room Quoter", "Job Overview", "Invoice Generator", "Photos & Attachments"];
export const QUOTE_STATUSES = ["Draft", "Sent", "Awaiting Approval", "Accepted", "In Progress", "Complete", "Invoice Due", "Paid"];
export const CALENDAR_TYPES = ["Personal Time", "Potential Job (Unconfirmed)", "Other Work", "Booked Job", "Quote Visit", "Invoice Due", "Other"];
export const PHOTO_TYPES = ["Before", "During", "After", "Damage", "Materials", "Other"];

export const ROOM_PRESETS = [
  { key: "Living Room", label: "Living", icon: "Sofa" },
  { key: "Dining Room", label: "Dining", icon: "Utensils" },
  { key: "Kitchen", label: "Kitchen", icon: "Home" },
  { key: "Hallway", label: "Hall", icon: "Home" },
  { key: "Bathroom", label: "Bathroom", icon: "Bath" },
  { key: "Bedroom", label: "Bedroom", icon: "BedDouble" },
  { key: "Other", label: "Other", icon: "Briefcase" }
];

export const OTHER_ROOM_OPTIONS = ["Master Bedroom", "Spare Bedroom", "Nursery", "En Suite", "Landing", "Stairs", "Porch", "Utility Room", "Office", "Garage", "Conservatory", "Garden Room", "Fence", "Garden Fence", "Shed", "Exterior Wall", "Front Door", "Internal Doors", "Other"];
export const JOB_TYPE_OPTIONS = ["Painting", "Wallpapering", "Combination", "Other"];
export const TOGGLE_THREE = ["Yes", "No", "Partial"];
export const MATERIAL_SUPPLIERS = ["Decorator", "Client", "Mixed"];
export const TIME_OPTIONS = [
  { label: "1/4 day", value: 0.25 },
  { label: "1/2 day", value: 0.5 },
  { label: "1 day", value: 1 },
  { label: "1.5 day", value: 1.5 },
  { label: "2 day", value: 2 },
  { label: "2.5 day", value: 2.5 },
  { label: "3 day", value: 3 }
];
export const ADJUSTMENT_OPTIONS = [
  { label: "Standard", value: 1 },
  { label: "+5%", value: 1.05 },
  { label: "+10%", value: 1.1 },
  { label: "+15%", value: 1.15 },
  { label: "+20%", value: 1.2 }
];
export const OTHER_FEATURE_KEYS = [
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

export const initialState = {
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
    paymentDetails: "Bank transfer details to be added.",
    paymentTerms: "Deposit due now. Remaining balance due on completion unless otherwise agreed.",
    quoteTerms: "This quotation is valid for 30 days from issue.",
    acceptanceNotes: "Please confirm acceptance by email or signed copy before the proposed start date.",
    themeMode: "Light",
    logoPath: "",
    logoUrl: "",
    calendarSyncProvider: "",
    calendarSyncEnabled: false
  }
};

