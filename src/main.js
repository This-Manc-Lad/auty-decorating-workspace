import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  Bath,
  BedDouble,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Home,
  Mail,
  MapPinned,
  MessageCircle,
  Phone,
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
  X,
  Cloud,
  Lock,
  LogOut,
  ShieldCheck,
  ImagePlus
} from "lucide-react";
import {
  ADJUSTMENT_OPTIONS,
  CALENDAR_TYPES,
  DAY_RATE,
  JOB_TABS,
  JOB_TYPE_OPTIONS,
  MAIN_TABS,
  MATERIAL_SUPPLIERS,
  OTHER_FEATURE_KEYS,
  OTHER_ROOM_OPTIONS,
  PHOTO_TYPES,
  QUOTE_STATUSES,
  ROOM_PRESETS,
  STORAGE_KEY,
  TIME_OPTIONS,
  TOGGLE_THREE,
  initialState
} from "./lib/constants.js";
import {
  addDays,
  adjustmentLabel,
  buildBackupPayload,
  calculateQuote,
  calendarColour,
  calendarTint,
  classNames,
  createRoomDraft,
  databaseName,
  displayName,
  generatedRoomDescription,
  loadLegacyWorkspace,
  money,
  monthNames,
  monthStamp,
  nextReference,
  normaliseState,
  parseBackupPayload,
  roomAutoPrice,
  roomNameFromDraft,
  shortDate,
  slug,
  splitName,
  today,
  uid,
  updateLinkedCollections
} from "./lib/utils.js";
import {
  deleteEntity,
  fetchWorkspaceData,
  getSession,
  onAuthStateChange,
  replaceWorkspaceData,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  upsertEntity,
  upsertSettings,
  uploadLogo,
  uploadPhoto
} from "./lib/repository.js";
import { isSupabaseConfigured } from "./lib/supabase.js";
import { generateWorkspacePdf } from "./lib/pdf.js";
import { formatErrors, validateClient, validateInvoice, validatePhotoUpload, validateQuote, validateRoom } from "./lib/validation.js";

const h = React.createElement;

const ROOM_ICONS = {
  Living: Sofa,
  Dining: Utensils,
  Kitchen: Home,
  Hall: Home,
  Bathroom: Bath,
  Bedroom: BedDouble,
  Other: Briefcase
};

const DEFAULT_LOGO_LIGHT = "./branding/auty-logo.png";
const DEFAULT_LOGO_DARK = "./branding/auty-logo.png";
const DEFAULT_HEADER_LOGO = "./branding/auty-logo-horizontal.png";
const WELCOME_BRUSH_STROKES = 12;

function resolveBrandLogo(settings, darkMode) {
  return settings?.logoUrl || (darkMode ? DEFAULT_LOGO_DARK : DEFAULT_LOGO_LIGHT);
}

function resolveHeaderLogo() {
  return DEFAULT_HEADER_LOGO;
}

function App() {
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState(MAIN_TABS[0]);
  const [jobTab, setJobTab] = useState(JOB_TABS[0]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [compactHeader, setCompactHeader] = useState(false);
  const [showPreviewBanner, setShowPreviewBanner] = useState(() => {
    try {
      return localStorage.getItem("auty-preview-banner-dismissed") !== "true";
    } catch {
      return true;
    }
  });
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  const workspace = useWorkspaceStore(setNotice);
  const { data, mode, session, authReady, syncLabel, isCloud, actions } = workspace;
  const darkMode = data.settings?.themeMode === "Dark";
  const brandLogo = resolveBrandLogo(data.settings, darkMode);
  const headerLogo = resolveHeaderLogo();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismissPreviewBanner = () => {
    setShowPreviewBanner(false);
    try {
      localStorage.setItem("auty-preview-banner-dismissed", "true");
    } catch {
      // Preview mode still works when browser storage is unavailable.
    }
  };

  const selectedClient = data.clients.find((client) => client.clientId === selectedClientId) || data.clients[0] || null;
  const selectedQuote = data.quotes.find((quote) => quote.quoteId === selectedQuoteId)
    || data.quotes.find((quote) => quote.clientId === selectedClient?.clientId)
    || data.quotes[0]
    || null;

  const installToHomeScreen = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      setInstallPromptEvent(null);
      return;
    }
    setNotice("Use your browser menu and choose Add to Home Screen");
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
    actions.upsert("clients", client, "clientId");
    setSelectedClientId(client.clientId);
    setNotice(isCloud ? "Client saved to cloud" : "Client created in preview mode");
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
    actions.upsert("quotes", updated, "quoteId");
    return updated;
  };

  const createQuote = (clientId = selectedClient?.clientId || "") => {
    if (!clientId) {
      const created = createClient();
      clientId = created.clientId;
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
    actions.upsert("quotes", quote, "quoteId");
    setSelectedClientId(clientId);
    setSelectedQuoteId(quote.quoteId);
    setActiveTab("Quoter");
    setJobTab("Room Quoter");
    setNotice(isCloud ? "New quote started" : "Preview quote started");
    return quote;
  };

  const generatePdf = async (kind, quote, invoice) => {
    if (!quote) {
      setNotice("No quote selected");
      return;
    }
    const client = data.clients.find((entry) => entry.clientId === quote.clientId);
    const clientErrors = validateClient(client, { requireAddress: true });
    const quoteErrors = validateQuote(quote, data.rooms, data.settings);
    const invoiceErrors = kind === "invoice" ? validateInvoice(invoice, quote, data.rooms, data.settings) : [];
    const errors = [...clientErrors, ...quoteErrors, ...invoiceErrors];
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    try {
      await generateWorkspacePdf({ kind, quote, invoice, data });
      setNotice(kind === "quote" ? "Quotation PDF ready" : "Invoice PDF ready");
    } catch (error) {
      setNotice(error.message || "PDF generation failed");
    }
  };

  const pageProps = {
    data,
    update: actions.update,
    upsert: actions.upsert,
    removeItem: actions.removeItem,
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
    setNotice,
    session,
    workspaceActions: actions,
    isCloud,
    syncLabel
  };

  if (!authReady) {
    return h(LoadingScreen, { darkMode });
  }

  if (mode === "auth") {
    return h(AuthScreen, {
      darkMode,
      brandLogo,
      setNotice,
      onSignIn: actions.signIn,
      onSignUp: actions.signUp
    });
  }

  return h("div", { className: classNames(
    "auty-app-shell min-h-screen pb-28 transition-colors duration-500",
    darkMode
      ? "bg-[radial-gradient(circle_at_top_left,_rgba(0,184,198,0.18),_transparent_24%),radial-gradient(circle_at_80%_14%,_rgba(212,175,55,0.16),_transparent_24%),radial-gradient(circle_at_24%_78%,_rgba(192,198,204,0.1),_transparent_26%),linear-gradient(180deg,_#060a14_0%,_#0a0f1f_46%,_#151920_100%)] text-slate-100"
      : "bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_24%),radial-gradient(circle_at_82%_16%,_rgba(0,184,198,0.14),_transparent_23%),radial-gradient(circle_at_18%_82%,_rgba(192,198,204,0.18),_transparent_24%),linear-gradient(180deg,_#fcfaf6_0%,_#f5f9fb_55%,_#f8f1e6_100%)] text-auty-ink"
  ) },
    h("div", { className: "relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6" },
      h("header", {
        "data-auty-top-dock": "true",
        "data-compact": compactHeader ? "true" : "false",
        className: classNames("auty-top-dock sticky top-[max(.75rem,env(safe-area-inset-top))] z-30 mx-auto mb-5 w-full max-w-3xl rounded-[26px] px-4 transition-all duration-300", compactHeader ? "py-2" : "py-3")
      },
        h("div", { className: classNames("mx-auto flex w-full max-w-xl flex-col items-center justify-center text-center transition-all duration-300", compactHeader ? "gap-0" : "gap-1") },
          h("img", {
            src: headerLogo,
            alt: "AUTY Decorating logo",
            className: classNames("auty-top-logo w-auto object-contain transition-all duration-300", compactHeader ? "h-8 max-w-[10rem] sm:h-9" : "h-12 max-w-[14rem] sm:h-14 sm:max-w-[18rem]")
          })
        ),
        h("button", {
          type: "button",
          onClick: () => setShowSettings(true),
          "aria-label": "Open workspace settings",
          title: "Open workspace settings",
          className: classNames("auty-settings-cog absolute right-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-full text-slate-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#01717F]", compactHeader ? "h-9 w-9" : "h-11 w-11")
        }, h(SettingsIcon, { size: compactHeader ? 17 : 19 }))
      ),
      h("div", { className: "animate-[fadeIn_.45s_ease] flex-1" },
        !isCloud && showPreviewBanner && h(PreviewBanner, { darkMode, onDismiss: dismissPreviewBanner }),
        activeTab === "Dashboard" && h(DashboardPage, pageProps),
        activeTab === "Calendar" && h(CalendarPage, pageProps),
        activeTab === "Client Database" && h(ClientDatabasePage, pageProps),
        activeTab === "Quoter" && h(CurrentJobPage, { ...pageProps, jobTab, setJobTab })
      )
    ),
    h(FloatingNav, { activeTab, setActiveTab, darkMode }),
    showSettings && h(SettingsPanel, {
      data,
      update: actions.update,
      setShowSettings,
      setNotice,
      installToHomeScreen,
      darkMode,
      exportBackup: actions.exportBackup,
      importBackupFile: actions.importBackupFile,
      uploadLogoFile: actions.uploadLogoFile,
      signOutUser: actions.signOut,
      session,
      isCloud
    }),
    showWelcome && h(WelcomeOverlay, { brandLogo }),
    notice && h("div", { className: classNames("fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl animate-[slideIn_.3s_ease]", darkMode ? "bg-slate-800/95" : "bg-slate-900") }, notice)
  );
}

function useWorkspaceStore(setNotice) {
  const cloudReady = isSupabaseConfigured();
  const [data, setData] = useState(loadLegacyWorkspace);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!cloudReady);
  const [syncLabel, setSyncLabel] = useState(cloudReady ? "Awaiting sign-in" : "Preview mode");
  const mode = cloudReady ? (session ? "app" : "auth") : "preview";

  useEffect(() => {
    if (!cloudReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [cloudReady, data]);

  useEffect(() => {
    if (!cloudReady) return undefined;
    let cancelled = false;

    const start = async () => {
      try {
        const current = await getSession();
        if (cancelled) return;
        setSession(current);
        setAuthReady(true);
        if (current?.user) {
          setSyncLabel("Loading workspace");
          const loaded = await fetchWorkspaceData(current.user.id);
          if (!cancelled) {
            setData(loaded);
            setSyncLabel("Cloud synced");
          }
        } else {
          setSyncLabel("Awaiting sign-in");
        }
      } catch (error) {
        if (!cancelled) {
          setAuthReady(true);
          setSyncLabel("Cloud setup issue");
          setNotice(error.message || "Unable to connect to Supabase");
        }
      }
    };

    start();

    let subscription = null;
    onAuthStateChange(async (nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      if (nextSession?.user) {
        setSyncLabel("Loading workspace");
        try {
          const loaded = await fetchWorkspaceData(nextSession.user.id);
          if (!cancelled) {
            setData(loaded);
            setSyncLabel("Cloud synced");
          }
        } catch (error) {
          if (!cancelled) setNotice(error.message || "Unable to load workspace");
        }
      } else {
        setData(loadLegacyWorkspace());
        setSyncLabel("Awaiting sign-in");
      }
    }).then((result) => {
      subscription = result?.data?.subscription || null;
    }).catch((error) => {
      setNotice(error.message || "Auth listener failed");
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe?.();
    };
  }, [cloudReady, setNotice]);

  const syncSettings = async (settings) => {
    if (!cloudReady || !session?.user) return;
    try {
      setSyncLabel("Saving settings");
      await upsertSettings(settings, session.user.id);
      setSyncLabel("Cloud synced");
    } catch (error) {
      setSyncLabel("Sync issue");
      setNotice(error.message || "Unable to save settings");
    }
  };

  const update = (key, updater) => {
    let nextValue;
    setData((current) => {
      nextValue = typeof updater === "function" ? updater(current[key], current) : updater;
      return normaliseState({ ...current, [key]: nextValue });
    });
    if (key === "settings") {
      syncSettings(normaliseState({ settings: nextValue }).settings);
    }
  };

  const upsert = (key, item, idField) => {
    setData((current) => {
      const items = current[key] || [];
      const nextItems = items.some((entry) => entry[idField] === item[idField])
        ? items.map((entry) => entry[idField] === item[idField] ? item : entry)
        : [item, ...items];
      return normaliseState({ ...current, [key]: nextItems });
    });
    if (cloudReady && session?.user) {
      setSyncLabel("Saving changes");
      upsertEntity(key, item, session.user.id)
        .then(() => setSyncLabel("Cloud synced"))
        .catch((error) => {
          setSyncLabel("Sync issue");
          setNotice(error.message || "Unable to save changes");
        });
    }
  };

  const removeItem = (key, idField, idValue) => {
    setData((current) => normaliseState({
      ...current,
      [key]: (current[key] || []).filter((entry) => entry[idField] !== idValue)
    }));
    if (cloudReady && session?.user) {
      setSyncLabel("Updating workspace");
      deleteEntity(key, idValue, session.user.id)
        .then(() => setSyncLabel("Cloud synced"))
        .catch((error) => {
          setSyncLabel("Sync issue");
          setNotice(error.message || "Unable to delete record");
        });
    }
  };

  const exportBackup = () => {
    const payload = buildBackupPayload(data, session?.user || null);
    downloadText(`auty-decorating-backup-${today()}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const importBackupFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = parseBackupPayload(reader.result);
        setData(imported);
        if (cloudReady && session?.user) {
          setSyncLabel("Importing backup");
          await replaceWorkspaceData(imported, session.user.id);
          setSyncLabel("Cloud synced");
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        }
        setNotice("Backup imported");
      } catch (error) {
        setNotice(error.message || "Backup import failed");
      }
    };
    if (file) reader.readAsText(file);
  };

  const uploadPhotoFile = async (file, form) => {
    if (!cloudReady || !session?.user) {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => resolve({
          photoId: uid("photo"),
          clientId: form.clientId,
          quoteId: form.quoteId,
          roomId: form.roomId,
          imageUrl: reader.result,
          photoType: form.photoType,
          caption: form.caption,
          uploadedDate: today()
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    setSyncLabel("Uploading photo");
    const photo = await uploadPhoto(file, form, session.user.id);
    setSyncLabel("Cloud synced");
    return photo;
  };

  const uploadLogoFile = async (file) => {
    if (!file) return;
    if (!cloudReady || !session?.user) {
      const reader = new FileReader();
      reader.onload = () => {
        update("settings", (settings) => ({ ...settings, logoUrl: reader.result, logoPath: "" }));
        setNotice("Logo added in preview mode");
      };
      reader.readAsDataURL(file);
      return;
    }
    try {
      setSyncLabel("Uploading logo");
      const logo = await uploadLogo(file, session.user.id);
      update("settings", (settings) => ({ ...settings, ...logo }));
      setSyncLabel("Cloud synced");
      setNotice("Logo uploaded");
    } catch (error) {
      setSyncLabel("Sync issue");
      setNotice(error.message || "Logo upload failed");
    }
  };

  const signIn = async ({ email, password }) => {
    const result = await signInWithPassword(email, password);
    setNotice("Signed in");
    return result;
  };

  const signUp = async ({ email, password }) => {
    const result = await signUpWithPassword(email, password);
    setNotice("Account created. Check your email if confirmation is enabled.");
    return result;
  };

  const signOutUser = async () => {
    await signOut();
    setNotice("Signed out");
  };

  return {
    data,
    session,
    mode,
    authReady,
    isCloud: cloudReady,
    syncLabel,
    actions: {
      update,
      upsert,
      removeItem,
      exportBackup,
      importBackupFile,
      uploadPhotoFile,
      uploadLogoFile,
      signIn,
      signUp,
      signOut: signOutUser
    }
  };
}

function AuthScreen({ darkMode, brandLogo, setNotice, onSignIn, onSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [submitting, setSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState("");

  const submit = async () => {
    if (!email || !password) {
      setNotice("Enter email and password");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setNotice("Use at least 8 characters for the password");
      return;
    }
    try {
      setSubmitting(true);
      setAuthFeedback("");
      if (mode === "signin") {
        await onSignIn({ email, password });
        setAuthFeedback("Signed in. Your workspace should load in a moment.");
      } else {
        const result = await onSignUp({ email, password });
        const needsEmailConfirmation = !result?.session;
        setAuthFeedback(
          needsEmailConfirmation
            ? "Account created. Check your email for a confirmation link before trying to sign in."
            : "Account created and signed in. Your workspace should load in a moment."
        );
      }
    } catch (error) {
      setAuthFeedback("");
      setNotice(error.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return h("div", { className: classNames(
    "min-h-screen px-4 py-8",
    darkMode
      ? "bg-[radial-gradient(circle_at_top_left,_rgba(0,184,198,0.12),_transparent_24%),radial-gradient(circle_at_82%_16%,_rgba(212,175,55,0.12),_transparent_22%),linear-gradient(180deg,#060a14_0%,#0a0f1f_100%)] text-white"
      : "bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_24%),radial-gradient(circle_at_84%_18%,_rgba(0,184,198,0.12),_transparent_22%),linear-gradient(180deg,#fcfaf6_0%,#f5f9fb_100%)] text-auty-ink"
  ) },
    h("div", { className: classNames(
      "mx-auto max-w-md rounded-[32px] p-6 shadow-[0_24px_60px_rgba(24,34,48,0.18),0_0_60px_rgba(0,184,198,0.08)] backdrop-blur-2xl",
      darkMode ? "border border-white/10 bg-[linear-gradient(135deg,rgba(10,15,31,0.82),rgba(27,30,36,0.7))]" : "border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,255,255,0.58))]"
    ) },
      h("img", { src: brandLogo, alt: "AUTY Decorating logo", className: "mx-auto h-52 w-auto max-w-full object-contain drop-shadow-[0_16px_32px_rgba(7,84,93,0.16)]" }),
      h("p", { className: "text-[11px] font-bold uppercase tracking-[0.28em] text-auty-gold" }, "AUTY Decorating Workspace"),
      h("h1", { className: classNames("mt-2 text-3xl font-black", darkMode ? "text-white" : "text-slate-900") }, "Sign in to your workspace"),
      h("p", { className: classNames("mt-2 text-sm", darkMode ? "text-white/70" : "text-slate-500") }, "Supabase authentication is now the main data path for production use. Each decorator gets their own cloud-synced workspace."),
      h("div", { className: classNames(
        "mt-4 rounded-[22px] px-4 py-3 text-sm",
        darkMode ? "border border-amber-300/20 bg-amber-400/10 text-amber-100" : "border border-amber-200 bg-amber-50 text-amber-900"
      ) },
        h("p", { className: "font-black" }, mode === "signin" ? "Signing in" : "Creating your account"),
        h("p", { className: "mt-1" }, mode === "signin"
          ? "Use the email and password you signed up with."
          : "After you press sign up, Supabase may send a confirmation email. If it does, open that email and tap the confirmation link before signing in.")
      ),
      h("div", { className: "mt-5 grid gap-4" },
        h(Field, { label: "Email", value: email, onChange: setEmail }),
        h(Field, { label: mode === "signup" ? "Password (8+ characters)" : "Password", value: password, type: "password", onChange: setPassword }),
        h("div", { className: "grid grid-cols-2 gap-2" },
          h(ActionButton, { label: submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account", onClick: submit, icon: Lock, className: "w-full" }),
          h(ActionButton, {
            label: mode === "signin" ? "Switch to Sign Up" : "Switch to Sign In",
            onClick: () => {
              setMode(mode === "signin" ? "signup" : "signin");
              setAuthFeedback("");
            },
            variant: "soft",
            className: "w-full"
          })
        ),
        authFeedback && h("div", { className: classNames(
          "rounded-[22px] px-4 py-3 text-sm",
          darkMode ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border border-emerald-200 bg-emerald-50 text-emerald-900"
        ) },
          h("p", { className: "font-black" }, "What happens next"),
          h("p", { className: "mt-1" }, authFeedback)
        ),
        submitting && h("p", { className: classNames("text-sm", darkMode ? "text-white/60" : "text-slate-500") }, "Working...")
      )
    )
  );
}

function LoadingScreen({ darkMode }) {
  return h("div", { className: classNames(
    "grid min-h-screen place-items-center",
    darkMode ? "bg-slate-950 text-white" : "bg-auty-cream text-auty-ink"
  ) },
    h("div", { className: "rounded-[28px] border border-white/50 bg-white/70 px-6 py-5 text-center shadow-xl backdrop-blur" },
      h("p", { className: "text-sm font-bold uppercase tracking-[0.28em] text-auty-gold" }, "Loading"),
      h("p", { className: "mt-2 text-lg font-black text-slate-900" }, "Preparing your workspace")
    )
  );
}

function WelcomeOverlay({ brandLogo }) {
  return h("div", {
    className: "auty-welcome pointer-events-none fixed inset-0 z-[100] grid place-items-center overflow-hidden px-6",
    "data-welcome-effect": "paintbrush-wipe"
  },
    h("div", { className: "auty-welcome-strokes absolute inset-0", "aria-hidden": "true" },
      Array.from({ length: WELCOME_BRUSH_STROKES }, (_, index) => h("span", {
        key: index,
        className: "auty-welcome-stroke",
        style: {
          "--stroke-index": index,
          "--stroke-delay": `${1760 + index * 46}ms`
        }
      }))
    ),
    h("div", { className: "auty-welcome-content relative z-10 text-center" },
      h("img", { src: brandLogo, alt: "AUTY Decorating", className: "auty-welcome-logo mx-auto max-h-[82vh] w-[min(94vw,680px)] object-contain" }),
      h("p", { className: "auty-welcome-copy -mt-6 text-xl tracking-[0.18em] text-slate-700 sm:text-2xl" }, "Welcome Back")
    ),
    h("span", { className: "auty-welcome-brush-glint absolute inset-y-0 z-20 w-24", "aria-hidden": "true" })
  );
}

function PreviewBanner({ darkMode, onDismiss }) {
  return h("div", { className: classNames(
    "mb-4 flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm shadow-sm backdrop-blur-xl",
    darkMode ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-white/70 bg-white/34 text-slate-700"
  ) },
    h(ShieldCheck, { size: 17, className: "shrink-0 text-auty-teal" }),
    h("p", { className: "min-w-0 flex-1 truncate" }, "Preview mode: changes are saved in this browser."),
    h("button", { type: "button", onClick: onDismiss, "aria-label": "Dismiss preview notice", className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/40 text-slate-600 hover:bg-white/70" }, h(X, { size: 16 }))
  );
}

function StatusPill({ label, darkMode, cloud }) {
  return h("span", {
    className: classNames(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold",
      cloud
        ? darkMode ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"
        : darkMode ? "bg-amber-300/15 text-amber-200" : "bg-amber-50 text-amber-700"
    )
  }, h(cloud ? Cloud : ShieldCheck, { size: 12 }), label);
}

function FloatingNav({ activeTab, setActiveTab, darkMode }) {
  const items = [
    { label: "Dashboard", route: "Dashboard", icon: ClipboardList },
    { label: "Calendar", route: "Calendar", icon: CalendarDays },
    { label: "Clients", route: "Client Database", icon: Users },
    { label: "Quoter", route: "Quoter", icon: Home }
  ];
  return h("nav", {
    "aria-label": "Main navigation",
    className: classNames(
    "auty-bottom-dock fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-[28px] border p-2 transition-colors duration-500",
    darkMode ? "border-white/10 bg-[rgba(10,15,31,0.72)]" : "border-white/60 bg-[rgba(255,255,255,0.78)]"
  ) },
    h("div", { className: "grid grid-cols-4 gap-2" },
      items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.route;
        return h("button", {
          key: item.label,
          type: "button",
          "data-auty-nav": item.route,
          "aria-label": item.label,
          "aria-current": active ? "page" : undefined,
          onClick: () => setActiveTab(item.route),
          className: classNames(
                "auty-dock-button flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 text-center text-xs leading-tight transition duration-300 focus:outline-none focus:ring-2 focus:ring-auty-teal focus:ring-offset-1 sm:min-h-[64px] sm:text-xs",
            active
              ? "bg-[#01717F] text-white shadow-[0_10px_24px_rgba(1,113,127,0.24)]"
              : darkMode
                ? "text-white/72 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-white/65 hover:text-slate-900"
          )
        }, h(Icon, { size: 20 }), item.label);
      })
    )
  );
}

function DashboardPage({ data, createClient, createQuote, setActiveTab, setJobTab, setSelectedClientId, setSelectedQuoteId, setNotice }) {
  const date = today();
  const bookedJobs = data.calendarEntries
    .filter((entry) => entry.type === "Booked Job")
    .sort((a, b) => `${a.startDate}${a.startTime || ""}`.localeCompare(`${b.startDate}${b.startTime || ""}`));
  const todaysJob = bookedJobs.find((entry) => entry.startDate <= date && entry.endDate >= date);
  const todaysClient = data.clients.find((client) => client.clientId === todaysJob?.clientId);
  const todaysQuote = data.quotes.find((quote) => quote.quoteId === todaysJob?.quoteId);
  const outstandingQuotes = data.quotes.filter((quote) => ["Sent", "Awaiting Approval"].includes(quote.quoteStatus)).slice(0, 4);
  const unpaidInvoices = data.invoices.filter((invoice) => invoice.invoiceStatus !== "Paid").slice(0, 4);
  const reminders = data.calendarEntries.filter((entry) => entry.type === "Reminder" && (entry.reminderStatus || "Pending") === "Pending" && entry.startDate <= date && entry.endDate >= date).slice(0, 4);
  const upcomingJobs = bookedJobs.filter((entry) => entry.startDate > date).slice(0, 4);

  const openMaps = () => {
    if (!todaysClient?.address) return setNotice("Add the client address to open Maps");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(todaysClient.address)}`, "_blank", "noopener,noreferrer");
  };
  const callClient = () => {
    if (!todaysClient?.telephone) return setNotice("Add the client phone number first");
    window.location.href = `tel:${todaysClient.telephone.replace(/[^+\d]/g, "")}`;
  };
  const messageClient = (message = "") => {
    if (!todaysClient?.telephone) return setNotice("Add the client phone number first");
    window.location.href = `sms:${todaysClient.telephone.replace(/[^+\d]/g, "")}${message ? `?body=${encodeURIComponent(message)}` : ""}`;
  };
  const runningLate = () => {
    const clientName = todaysClient ? displayName(todaysClient) : "there";
    const decoratorName = data.settings.decoratorName || data.settings.businessName || "AUTY Decorating";
    const suggested = `Hi ${clientName}, it’s ${decoratorName}. I’m running slightly late but I’ll be with you as soon as possible.`;
    const message = window.prompt("Edit your message before opening it", suggested);
    if (message) messageClient(message);
  };
  const openQuote = (quote) => {
    setSelectedClientId(quote.clientId);
    setSelectedQuoteId(quote.quoteId);
    setActiveTab("Quoter");
    setJobTab("Job Overview");
  };
  const openInvoice = (invoice) => {
    setSelectedClientId(invoice.clientId);
    setSelectedQuoteId(invoice.quoteId);
    setActiveTab("Quoter");
    setJobTab("Invoice Generator");
  };

  return h("div", { className: "space-y-5" },
    h("section", { className: "rounded-[30px] border border-white/70 p-5" },
      h("div", { className: "flex flex-wrap items-start justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-[11px] uppercase tracking-[0.26em] text-auty-gold" }, "Today’s Job"),
          h("h2", { className: "mt-1 text-2xl text-slate-900" }, todaysJob ? (todaysJob.title || displayName(todaysClient)) : "No job booked today"),
          h("p", { className: "mt-1 text-sm text-slate-500" }, todaysJob ? `${displayName(todaysClient)} · ${todaysClient?.address || "Address not added"}` : "Your next booked job will appear here automatically.")
        ),
        todaysJob && h("span", { className: "rounded-full bg-[#01717F] px-3 py-2 text-xs text-white" }, todaysQuote?.quoteStatus || todaysJob.type)
      ),
      todaysJob ? h("div", { className: "mt-4 grid gap-3 sm:grid-cols-3" },
        h(InfoTile, { label: "Client", value: displayName(todaysClient) }),
        h(InfoTile, { label: "Start time", value: todaysJob.startTime || "Time not set" }),
        h(InfoTile, { label: "Job reference", value: todaysQuote?.quoteReference || todaysJob.title || "Booked job" })
      ) : h("div", { className: "mt-4 rounded-[22px] border border-dashed border-white/80 bg-white/24 p-4 text-sm text-slate-500" }, upcomingJobs.length ? `Next job: ${shortDate(upcomingJobs[0].startDate)} · ${upcomingJobs[0].title}` : "Add a booked job in the Calendar to build your daily plan."),
      h("div", { className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" },
        h(DashboardAction, { label: "Open in Maps", icon: MapPinned, onClick: openMaps, disabled: !todaysJob }),
        h(DashboardAction, { label: "Call Client", icon: Phone, onClick: callClient, disabled: !todaysJob }),
        h(DashboardAction, { label: "Message Client", icon: MessageCircle, onClick: () => messageClient(), disabled: !todaysJob }),
        h(DashboardAction, { label: "Running Late", icon: Mail, onClick: runningLate, disabled: !todaysJob, accent: true })
      )
    ),
    h("section", { className: "grid gap-4 lg:grid-cols-2" },
      h(DashboardList, {
        title: "Outstanding Quotes",
        count: outstandingQuotes.length,
        empty: "No quotes are waiting for a response.",
        items: outstandingQuotes.map((quote) => ({ id: quote.quoteId, title: quote.quoteReference, detail: displayName(data.clients.find((client) => client.clientId === quote.clientId)), value: money(quote.totalAmount), status: quote.quoteStatus, onClick: () => openQuote(quote) }))
      }),
      h(DashboardList, {
        title: "Unpaid Invoices",
        count: unpaidInvoices.length,
        empty: "No unpaid invoices. Nicely tidy.",
        items: unpaidInvoices.map((invoice) => ({ id: invoice.invoiceId, title: invoice.invoiceReference, detail: displayName(data.clients.find((client) => client.clientId === invoice.clientId)), value: money(invoice.balanceDue ?? invoice.jobTotal), status: invoice.invoiceStatus === "Invoice Due" ? "Unpaid" : invoice.invoiceStatus, onClick: () => openInvoice(invoice) }))
      }),
      h(DashboardList, {
        title: "Reminders Due Today",
        count: reminders.length,
        empty: "No reminders due today.",
        items: reminders.map((reminder) => ({ id: reminder.calendarEntryId, title: reminder.title, detail: reminder.notes || "Reminder", value: reminder.startTime || "Today", status: "Due", onClick: () => setActiveTab("Calendar") }))
      }),
      h(DashboardList, {
        title: "Upcoming Jobs",
        count: upcomingJobs.length,
        empty: "No upcoming jobs are booked.",
        items: upcomingJobs.map((job) => ({ id: job.calendarEntryId, title: job.title, detail: displayName(data.clients.find((client) => client.clientId === job.clientId)), value: shortDate(job.startDate), status: "Booked", onClick: () => setActiveTab("Calendar") }))
      })
    ),
    h("section", { className: "rounded-[30px] border border-white/70 p-5" },
      h("div", { className: "flex items-center justify-between gap-3" },
        h("div", null, h("p", { className: "text-[11px] uppercase tracking-[0.24em] text-auty-gold" }, "Work Summary"), h("h3", { className: "mt-1 text-lg text-slate-900" }, "Your workspace at a glance")),
        h("button", { type: "button", onClick: () => { createClient(); setActiveTab("Client Database"); }, className: "rounded-full bg-[#293E48] px-4 py-2 text-sm text-white" }, "New Client")
      ),
      h("div", { className: "mt-4 grid grid-cols-3 gap-3" },
        [["Jobs", bookedJobs.length, "#01717F"], ["Quotes", data.quotes.length, "#C88933"], ["Invoices", data.invoices.length, "#293E48"]].map(([label, value, colour]) => h("button", { key: label, type: "button", onClick: () => label === "Jobs" ? setActiveTab("Calendar") : label === "Quotes" ? (setActiveTab("Quoter"), setJobTab("Job Overview")) : (setActiveTab("Quoter"), setJobTab("Invoice Generator")), className: "rounded-[22px] border border-white/70 bg-white/34 p-4 text-left" },
          h("span", { className: "block h-1.5 rounded-full", style: { backgroundColor: colour } }),
          h("span", { className: "mt-3 block text-sm text-slate-500" }, label),
          h("strong", { className: "mt-1 block text-2xl text-slate-900" }, value)
        ))
      )
    )
  );
}

function CalendarPage({ data, upsert, setNotice }) {
  const [monthView, setMonthView] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState("");
  const [entry, setEntry] = useState({
    title: "",
    type: "Personal Time",
    startDate: today(),
    endDate: today(),
    clientId: "",
    quoteId: "",
    notes: "",
    startTime: "09:00",
    reminderType: "Upcoming appointment",
    reminderStatus: "Pending",
    syncStatus: "not_connected",
    externalCalendarId: "",
    externalEventId: "",
    externalProvider: ""
  });

  const monthGrid = buildMonthGrid(monthView, data.calendarEntries);
  const visibleEntries = data.calendarEntries
    .filter((item) => item.startDate.slice(0, 7) <= monthStamp(monthView) && item.endDate.slice(0, 7) >= monthStamp(monthView))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const overlaps = data.calendarEntries.some((item) => item.type === "Personal Time" && entry.type !== "Personal Time" && entry.startDate <= item.endDate && entry.endDate >= item.startDate);

  const saveEntry = () => {
    if (!entry.title || !entry.startDate) {
      setNotice("Title and start date are required");
      return;
    }
    upsert("calendarEntries", { ...entry, calendarEntryId: uid("cal") }, "calendarEntryId");
    setEntry({ ...entry, title: "", notes: "", type: "Personal Time" });
    setNotice(overlaps ? "Calendar booking saved with overlap warning" : "Calendar booking saved");
  };

  const bookDate = (date) => {
    setEntry((current) => ({ ...current, startDate: date, endDate: date }));
    setNotice(`Booking form ready for ${shortDate(date)}`);
    window.requestAnimationFrame(() => {
      document.getElementById("calendar-booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("calendar-booking-title")?.focus({ preventScroll: true });
    });
  };

  return h("div", { className: "grid gap-5 lg:grid-cols-[1.3fr_0.7fr]" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.48))] p-4 shadow-[0_22px_55px_rgba(24,34,48,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl sm:p-5" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Business Calendar"),
          h("h2", { className: "text-2xl font-black text-slate-900" }, `${monthNames[monthView.getMonth()]} ${monthView.getFullYear()}`)
        ),
        h("div", { className: "flex items-center gap-2" },
          h(IconButton, { label: "Previous month", icon: ChevronLeft, onClick: () => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1)) }),
          h(IconButton, { label: "Next month", icon: ChevronRight, onClick: () => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1)) })
        )
      ),
      h("div", { className: "mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:gap-2 sm:text-[11px] sm:tracking-[0.2em]" },
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => h("div", { key: day, className: "py-2" }, day))
      ),
      h("div", { className: "auty-calendar-grid mt-2 grid grid-cols-7 gap-1.5 sm:gap-2" },
        monthGrid.map((day) => {
          const bandEntry = day.entries.find((item) => item.type !== "Personal Time") || day.entries[0];
          const bandPosition = !bandEntry ? "none" : bandEntry.startDate === bandEntry.endDate ? "single" : day.date === bandEntry.startDate ? "start" : day.date === bandEntry.endDate ? "end" : "middle";
          return h("div", {
          key: `${day.date}-${day.inMonth}`,
          className: "auty-calendar-cell",
          "data-expanded": expandedDate === day.date ? "true" : "false",
          "data-muted": day.inMonth ? "false" : "true",
          "data-band": bandPosition,
          style: bandEntry ? { "--calendar-band": calendarBandColour(bandEntry.type), "--calendar-tint": calendarBandTint(bandEntry.type) } : undefined
        },
          h("button", {
            type: "button",
            "aria-expanded": expandedDate === day.date,
            "aria-label": `${shortDate(day.date)}${day.entries.length ? `, ${day.entries.length} entries` : ", no entries"}`,
            onClick: () => setExpandedDate((current) => current === day.date ? "" : day.date),
            className: classNames(
              "relative grid place-items-center rounded-full text-sm text-slate-700 transition",
              expandedDate === day.date ? "h-10 w-10 bg-auty-teal text-white" : "h-full w-full",
              day.date === today() && expandedDate !== day.date ? "bg-slate-800 text-white" : ""
            )
          },
            h("span", null, new Date(`${day.date}T12:00:00`).getDate())
          ),
          expandedDate === day.date && h("div", { className: "mt-3 grid gap-2" },
            h("div", { className: "flex flex-wrap items-center justify-between gap-3" },
              h("p", { className: "text-sm text-slate-500" }, shortDate(day.date)),
              h("button", {
                type: "button",
                onClick: () => bookDate(day.date),
                className: "rounded-full bg-white/48 px-3 py-2 text-xs text-auty-teal hover:bg-white/72"
              }, "Book this date")
            ),
            day.entries.length
              ? day.entries.map((entryItem) => h("div", { key: entryItem.calendarEntryId, className: "rounded-[18px] border border-white/70 bg-white/42 p-3 text-left" },
                h("div", { className: "flex items-center gap-2 border-l-4 pl-2", style: { borderColor: calendarBandColour(entryItem.type) } },
                  h("p", { className: "text-sm text-slate-800" }, entryItem.title)
                ),
                h("p", { className: "mt-1 text-xs text-slate-500" }, `${entryItem.type} | ${shortDate(entryItem.startDate)} to ${shortDate(entryItem.endDate)}`),
                entryItem.notes && h("p", { className: "mt-1 text-xs text-slate-500" }, entryItem.notes)
              ))
              : h("p", { className: "rounded-[18px] border border-dashed border-white/80 bg-white/24 p-3 text-sm text-slate-500" }, "Nothing booked for this date.")
          )
        ); })
      ),
      h("div", { className: "mt-5 flex flex-wrap gap-2", "aria-label": "Calendar colour key" },
        CALENDAR_TYPES.map((type) => h("span", {
          key: type,
          className: "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] text-slate-700",
          style: { borderColor: `${calendarBandColour(type)}66`, backgroundColor: calendarBandTint(type) }
        }, h("span", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: calendarBandColour(type) } }), type))
      )
    ),
    h("aside", { className: "space-y-4" },
      h("div", { id: "calendar-booking-form", className: "scroll-mt-28 rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.5))] p-5 shadow-[0_22px_55px_rgba(24,34,48,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Add Booking"),
        h("div", { className: "mt-4 space-y-3" },
          h(Field, { id: "calendar-booking-title", label: "Title", value: entry.title, onChange: (value) => setEntry({ ...entry, title: value }) }),
          h(Field, { label: "Type", value: entry.type, options: CALENDAR_TYPES, onChange: (value) => setEntry({ ...entry, type: value }) }),
          h(Field, { label: "Start Date", value: entry.startDate, type: "date", onChange: (value) => setEntry({ ...entry, startDate: value }) }),
          h(Field, { label: "End Date", value: entry.endDate, type: "date", onChange: (value) => setEntry({ ...entry, endDate: value }) }),
          entry.type === "Reminder" && h(Field, { label: "Due Time", value: entry.startTime, type: "time", onChange: (value) => setEntry({ ...entry, startTime: value }) }),
          entry.type === "Reminder" && h(Field, { label: "Reminder Category", value: entry.reminderType, options: ["Quote follow-up", "Payment to chase", "Job starting soon", "Upcoming appointment", "Materials to order", "Invoice overdue"], onChange: (value) => setEntry({ ...entry, reminderType: value }) }),
          entry.type === "Reminder" && h(Field, { label: "Reminder Status", value: entry.reminderStatus, options: ["Pending", "Completed", "Dismissed"], onChange: (value) => setEntry({ ...entry, reminderStatus: value }) }),
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
                type: quote ? "Potential Job (Unconfirmed)" : entry.type,
                startDate: quote?.proposedStartDate || entry.startDate,
                endDate: calc?.completionDate || entry.endDate,
                notes: quote ? quote.quoteReference : entry.notes
              });
            }
          }),
          h(Field, { label: "Notes", value: entry.notes, textarea: true, onChange: (value) => setEntry({ ...entry, notes: value }) }),
          overlaps && h("div", { className: "rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700" }, "This booking overlaps with personal time."),
          h(ActionButton, { label: "Save Calendar Entry", onClick: saveEntry, icon: Save })
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Month Entries"),
        visibleEntries.length ? h("div", { className: "mt-4 space-y-3" },
          visibleEntries.map((entryItem) => h("div", { key: entryItem.calendarEntryId, className: "rounded-[22px] bg-white/36 p-4 shadow-sm" },
            h("div", { className: "flex items-start justify-between gap-3" },
              h("div", null,
                h("span", { className: "inline-flex rounded-full border px-3 py-1 text-[11px]", style: { color: calendarBandColour(entryItem.type), borderColor: `${calendarBandColour(entryItem.type)}66`, backgroundColor: calendarBandTint(entryItem.type) } }, entryItem.type),
                h("p", { className: "mt-2 font-black text-slate-900" }, entryItem.title),
                h("p", { className: "text-sm text-slate-500" }, `${shortDate(entryItem.startDate)} to ${shortDate(entryItem.endDate)}`)
              ),
              h(IconButton, { label: `Download ${entryItem.title} calendar file`, icon: Download, onClick: () => exportIcs(entryItem) })
            ),
            entryItem.type === "Reminder" && h("div", { className: "mt-3 grid grid-cols-2 gap-2" },
              h("button", { type: "button", onClick: () => upsert("calendarEntries", { ...entryItem, reminderStatus: "Completed" }, "calendarEntryId"), className: "rounded-full bg-[#01717F] px-3 py-2 text-xs text-white" }, "Complete"),
              h("button", { type: "button", onClick: () => upsert("calendarEntries", { ...entryItem, reminderStatus: "Dismissed" }, "calendarEntryId"), className: "rounded-full bg-[#293E48] px-3 py-2 text-xs text-white" }, "Dismiss")
            )
          ))
        ) : h(EmptyState, { title: "No entries in this month", body: "Add bookings, quote visits, jobs, reminders, or personal time on the right." })
      )
    )
  );
}

function calendarBandColour(type) {
  const colours = {
    "Personal Time": "#C88933",
    "Potential Job (Unconfirmed)": "#9B6B2F",
    "Other Work": "#008898",
    "Booked Job": "#01717F",
    "Quote Visit": "#006878",
    "Invoice Due": "#293E48",
    Reminder: "#607D86",
    Other: "#A2CACE"
  };
  return colours[type] || "#008898";
}

function calendarBandTint(type) {
  const hex = calendarBandColour(type).replace("#", "");
  const value = Number.parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, .14)`;
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

function ClientDatabasePage({ data, upsert, removeItem, createClient, createQuote, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab, setNotice }) {
  const [query, setQuery] = useState("");
  const [databaseSection, setDatabaseSection] = useState("Contacts");
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
    const errors = validateClient(draft);
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    upsert("clients", { ...draft, name: displayName(draft) }, "clientId");
    setEditId("");
    setOpenId("");
    setNotice("Client saved");
  };

  const deleteClient = (client) => {
    const ok = window.confirm(`Delete ${displayName(client)} and all related quotes, rooms, invoices, photos, and calendar items? This cannot be undone.`);
    if (!ok) return;
    const quoteIds = data.quotes.filter((quote) => quote.clientId === client.clientId).map((quote) => quote.quoteId);
    const roomIds = data.rooms.filter((room) => quoteIds.includes(room.quoteId)).map((room) => room.roomId);
    removeItem("clients", "clientId", client.clientId);
    updateLinkedCollections(client.clientId, quoteIds, roomIds, removeItem);
    setOpenId("");
    setEditId("");
    setNotice("Client deleted");
  };

  return h("div", { className: "space-y-5" },
    h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" },
        h("div", { className: "grow" },
          h("p", { className: "text-[11px] uppercase tracking-[0.24em] text-auty-gold" }, "Clients"),
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
        h(ActionButton, { label: "Add Client", onClick: () => { const client = createClient(); beginEdit(client); }, icon: UserPlus })
      ),
      h("div", { className: "mt-4 grid grid-cols-3 gap-2 rounded-[22px] border border-white/70 bg-white/28 p-1.5" },
        ["Contacts", "Invoices", "Quotes Database"].map((section) => h("button", { key: section, type: "button", "aria-pressed": databaseSection === section, onClick: () => setDatabaseSection(section), className: classNames("rounded-[18px] px-2 py-3 text-xs sm:text-sm", databaseSection === section ? "bg-[#01717F] text-white" : "text-slate-600 hover:bg-white/60") }, section))
      )
    ),
    databaseSection === "Contacts" ? (clients.length ? h("div", { className: "space-y-3" },
      clients.map((client) => {
        const open = openId === client.clientId;
        const editing = editId === client.clientId;
        const draft = drafts[client.clientId] || client;
        const quotes = data.quotes.filter((quote) => quote.clientId === client.clientId);
        const invoices = data.invoices.filter((invoice) => invoice.clientId === client.clientId);
        const photos = data.photos.filter((photo) => photo.clientId === client.clientId);
        const reminders = data.calendarEntries.filter((entry) => entry.type === "Reminder" && entry.clientId === client.clientId);
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
              h(IconButton, { label: editing ? "Save client" : "Edit client", icon: editing ? Save : SquarePen, onClick: () => editing ? saveClient(client.clientId) : beginEdit(client) }),
              h(IconButton, { label: open ? "Close client details" : "Open client details", icon: open ? X : ChevronDown, onClick: () => setOpenId(open ? "" : client.clientId) })
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
                        setActiveTab("Quoter");
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
                        setActiveTab("Quoter");
                        setJobTab("Room Quoter");
                      },
                      icon: ClipboardList
                    }),
                    h(ActionButton, {
                      label: "Quoter",
                      onClick: () => {
                        setSelectedClientId(client.clientId);
                        setActiveTab("Quoter");
                        setJobTab("Job Overview");
                      },
                      icon: Home,
                      variant: "soft"
                    }),
                    h(ActionButton, {
                      label: "Delete Client",
                      onClick: () => deleteClient(client),
                      icon: Trash2,
                      variant: "danger"
                    })
                  )
                ),
                h(InfoPanel, { title: "Related Quotes", items: quotes.map((quote) => quote.quoteReference) }),
                h(InfoPanel, { title: "Related Invoices", items: invoices.map((invoice) => invoice.invoiceReference) }),
                h(InfoPanel, { title: "Related Photos", items: photos.map((photo) => photo.caption || photo.photoType) })
                ,h(InfoPanel, { title: "Reminder History", items: reminders.map((reminder) => `${shortDate(reminder.startDate)} · ${reminder.title} · ${reminder.reminderStatus || "Pending"}`) })
              )
            ),
            editing && h("div", { className: "mt-4" }, h(ActionButton, { label: "Save Client", onClick: () => saveClient(client.clientId), icon: Save }))
          )
        );
      })
    ) : h(EmptyState, { title: "No clients found", body: "Add a client or change the search to see more results." }))
      : databaseSection === "Invoices"
        ? h(DatabaseInvoices, { data, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab })
        : h(DatabaseQuotes, { data, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab })
  );
}

function DatabaseInvoices({ data, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab }) {
  if (!data.invoices.length) return h(EmptyState, { title: "No invoices saved", body: "Generated invoices will appear here, linked to their client and quote." });
  return h("div", { className: "grid gap-4 lg:grid-cols-2" }, data.invoices.map((invoice) => {
    const client = data.clients.find((entry) => entry.clientId === invoice.clientId);
    return h("article", { key: invoice.invoiceId, className: "rounded-[28px] border border-white/70 bg-white/34 p-5" },
      h("div", { className: "flex items-start justify-between gap-3" },
        h("div", null, h("h3", { className: "text-lg text-slate-900" }, invoice.invoiceReference), h("p", { className: "mt-1 text-sm text-slate-500" }, `${displayName(client)} · ${client?.address || "Address not set"}`)),
        h("span", { className: "rounded-full bg-[#293E48] px-3 py-1 text-xs text-white" }, invoice.invoiceStatus === "Invoice Due" ? "Unpaid" : invoice.invoiceStatus)
      ),
      h("div", { className: "mt-4 grid grid-cols-2 gap-3" },
        h(InfoTile, { label: "Invoice Date", value: shortDate(invoice.invoiceDate) }),
        h(InfoTile, { label: "Due Date", value: shortDate(invoice.paymentDueDate) }),
        h(InfoTile, { label: "Total", value: money(invoice.jobTotal) }),
        h(InfoTile, { label: "Amount Paid", value: money(invoice.depositPaid) }),
        h(InfoTile, { label: "Outstanding", value: money(invoice.balanceDue) })
      ),
      h(PaymentChaseButtons, { invoice, client, settings: data.settings }),
      h("button", { type: "button", onClick: () => { setSelectedClientId(invoice.clientId); setSelectedQuoteId(invoice.quoteId); setActiveTab("Quoter"); setJobTab("Invoice Generator"); }, className: "mt-3 w-full rounded-full bg-[#01717F] px-4 py-2 text-sm text-white" }, "Open Invoice")
    );
  }));
}

function DatabaseQuotes({ data, setSelectedClientId, setSelectedQuoteId, setActiveTab, setJobTab }) {
  if (!data.quotes.length) return h(EmptyState, { title: "No quotes saved", body: "Saved quotes will appear here with their client, deposit and status." });
  return h("div", { className: "grid gap-4 lg:grid-cols-2" }, data.quotes.map((quote) => {
    const client = data.clients.find((entry) => entry.clientId === quote.clientId);
    const status = quote.quoteStatus === "Complete" ? "Converted to Job" : quote.quoteStatus;
    return h("article", { key: quote.quoteId, className: "rounded-[28px] border border-white/70 bg-white/34 p-5" },
      h("div", { className: "flex items-start justify-between gap-3" },
        h("div", null, h("h3", { className: "text-lg text-slate-900" }, quote.quoteReference), h("p", { className: "mt-1 text-sm text-slate-500" }, `${displayName(client)} · ${client?.address || "Address not set"}`)),
        h("span", { className: "rounded-full bg-[#C88933] px-3 py-1 text-xs text-white" }, status)
      ),
      h("div", { className: "mt-4 grid grid-cols-2 gap-3" },
        h(InfoTile, { label: "Quote Date", value: shortDate(quote.quoteDate) }),
        h(InfoTile, { label: "Quote Total", value: money(quote.totalAmount) }),
        h(InfoTile, { label: "Deposit", value: money(quote.depositAmount) })
      ),
      h("button", { type: "button", onClick: () => { setSelectedClientId(quote.clientId); setSelectedQuoteId(quote.quoteId); setActiveTab("Quoter"); setJobTab("Job Overview"); }, className: "mt-4 w-full rounded-full bg-[#01717F] px-4 py-2 text-sm text-white" }, "Open Quote")
    );
  }));
}

function CurrentJobPage(props) {
  const { jobTab, setJobTab } = props;
  return h("div", { className: "space-y-5" },
    h("div", { className: "auty-job-tabs" },
        JOB_TABS.map((tab) => h("button", {
          key: tab,
          type: "button",
          "aria-pressed": jobTab === tab,
          onClick: () => setJobTab(tab),
          className: "px-3 py-3 text-xs transition duration-300 sm:text-sm"
        }, tab))
    ),
    jobTab === "Room Quoter" && h(RoomQuoterPage, props),
    jobTab === "Job Overview" && h(JobOverviewPage, props),
    jobTab === "Invoice Generator" && h(InvoiceGeneratorPage, props),
    jobTab === "Photos & Attachments" && h(PhotosPage, props)
  );
}

function RoomQuoterPage({ data, createClient, createQuote, selectedClient, selectedQuote, upsert, removeItem, saveQuoteTotals, setNotice, setSelectedClientId, setSelectedQuoteId, setJobTab, workspaceActions, isCloud }) {
  const [draft, setDraft] = useState(createRoomDraft(selectedQuote?.quoteId || ""));
  const [existingClientId, setExistingClientId] = useState(selectedClient?.clientId || "");
  const [quoteFlow, setQuoteFlow] = useState("choose");
  const [newClientDraft, setNewClientDraft] = useState({ name: "", telephone: "", email: "", address: "", quoteDate: today() });

  useEffect(() => {
    setDraft(createRoomDraft(selectedQuote?.quoteId || ""));
  }, [selectedQuote?.quoteId]);

  useEffect(() => {
    if (selectedClient?.clientId) setExistingClientId(selectedClient.clientId);
  }, [selectedClient?.clientId]);

  const quote = selectedQuote;
  const client = selectedClient;
  const roomName = roomNameFromDraft(draft);
  const autoPrice = roomAutoPrice(draft, data.settings.dayRate || DAY_RATE);
  const finalRoomPrice = draft.overridePrice !== "" ? Number(draft.overridePrice) : autoPrice;
  const description = draft.generatedDescription || generatedRoomDescription({ ...draft, roomName });
  const quoteRooms = data.rooms.filter((room) => room.quoteId === quote?.quoteId);

  const selectOrCreateQuote = (mode) => {
    if (mode === "new") {
      setQuoteFlow("new");
      return;
    }
    if (!existingClientId) {
      setNotice("Select an existing client first");
      return;
    }
    const quoteCreated = createQuote(existingClientId);
    setSelectedClientId(existingClientId);
    setSelectedQuoteId(quoteCreated.quoteId);
    setQuoteFlow("ready");
  };

  const saveNewClientQuote = () => {
    const split = splitName(newClientDraft.name);
    const clientDraft = {
      surname: split.surname,
      givenName: split.givenName,
      name: newClientDraft.name,
      telephone: newClientDraft.telephone,
      email: newClientDraft.email,
      address: newClientDraft.address
    };
    const errors = validateClient(clientDraft);
    if (!newClientDraft.address.trim()) errors.push("Job address is required.");
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    const clientCreated = createClient(clientDraft);
    const quoteCreated = createQuote(clientCreated.clientId);
    const datedQuote = { ...quoteCreated, quoteDate: newClientDraft.quoteDate || today() };
    upsert("quotes", datedQuote, "quoteId");
    setSelectedClientId(clientCreated.clientId);
    setSelectedQuoteId(quoteCreated.quoteId);
    setQuoteFlow("ready");
  };

  const clearForm = () => {
    setDraft(createRoomDraft(quote?.quoteId || ""));
    setNotice("Room form cleared");
  };

  const startAnotherQuote = () => {
    if (quote?.quoteStatus === "Draft" && !(quote.roomIds || []).length) {
      removeItem("quotes", "quoteId", quote.quoteId);
      setSelectedQuoteId("");
      setNotice("Empty draft discarded");
    }
    setQuoteFlow("choose");
  };

  const patch = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const patchFeature = (key, value) => setDraft((current) => ({ ...current, otherFeatures: { ...current.otherFeatures, [key]: value } }));

  const attachRoomPhoto = async (file) => {
    const form = { clientId: client?.clientId || "", quoteId: quote?.quoteId || "", roomId: draft.roomId, photoType: "Before", caption: `${roomName} quote photo` };
    const errors = validatePhotoUpload(file, form);
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    try {
      const photo = await workspaceActions.uploadPhotoFile(file, form);
      upsert("photos", photo, "photoId");
      setNotice(isCloud ? "Room photo uploaded" : "Room photo attached in preview mode");
    } catch (error) {
      setNotice(error.message || "Photo upload failed");
    }
  };

  const shouldShowPaintNotes = draft.jobType === "Painting" || draft.jobType === "Combination";
  const shouldShowWallpaperNotes = draft.jobType === "Wallpapering" || draft.jobType === "Combination";
  const woodworkActive = [draft.skirtingBoards, draft.architrave, draft.doors, draft.otherFeatures.windowSill].some((value) => value !== "No");
  const ceilingNotesOpen = draft.ceiling === "Yes";
  const otherRoomOpen = draft.roomPreset === "Other";
  const customJobOpen = draft.jobType === "Other";

  const completeRoom = () => {
    if (!quote) {
      setNotice("Start a quote first");
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
    const errors = validateRoom(savedRoom);
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
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

  if (quoteFlow !== "ready") {
    return h("section", { className: "mx-auto max-w-3xl rounded-[30px] border border-white/70 bg-white/34 p-5" },
      h("div", { className: "grid gap-3 sm:grid-cols-2" },
        h(ActionButton, { label: "New Quote / New Client", onClick: () => selectOrCreateQuote("new"), icon: UserPlus, className: "w-full" }),
        h(ActionButton, { label: "New Quote / Existing Client", onClick: () => setQuoteFlow("existing"), icon: Users, variant: "soft", className: "w-full" })
      ),
      quoteFlow === "new" && h("div", { className: "mt-5 rounded-[24px] border border-white/70 bg-white/32 p-4" },
        h("h2", { className: "text-xl text-slate-900" }, "New client details"),
        h("div", { className: "mt-4 grid gap-4 sm:grid-cols-2" },
          h(Field, { label: "Client Name", value: newClientDraft.name, onChange: (value) => setNewClientDraft({ ...newClientDraft, name: value }) }),
          h(Field, { label: "Phone Number", value: newClientDraft.telephone, onChange: (value) => setNewClientDraft({ ...newClientDraft, telephone: value }) }),
          h(Field, { label: "Email Address", value: newClientDraft.email, type: "email", onChange: (value) => setNewClientDraft({ ...newClientDraft, email: value }) }),
          h(Field, { label: "Quote Date", value: newClientDraft.quoteDate, type: "date", onChange: (value) => setNewClientDraft({ ...newClientDraft, quoteDate: value }) }),
          h("div", { className: "sm:col-span-2" }, h(Field, { label: "Job Address", value: newClientDraft.address, textarea: true, onChange: (value) => setNewClientDraft({ ...newClientDraft, address: value }) }))
        ),
        h(ActionButton, { label: "Save Client & Load Room Options", onClick: saveNewClientQuote, icon: Save, className: "mt-4 w-full" })
      ),
      quoteFlow === "existing" && h("div", { className: "mt-5 rounded-[24px] border border-white/70 bg-white/32 p-4" },
        h(Field, { label: "Existing Client", value: existingClientId, options: [{ value: "", label: "Choose client" }, ...data.clients.map((entry) => ({ value: entry.clientId, label: databaseName(entry) }))], onChange: setExistingClientId }),
        existingClientId && h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2" },
          h(InfoTile, { label: "Client", value: displayName(data.clients.find((entry) => entry.clientId === existingClientId)) }),
          h(InfoTile, { label: "Phone", value: data.clients.find((entry) => entry.clientId === existingClientId)?.telephone || "Not set" }),
          h(InfoTile, { label: "Email", value: data.clients.find((entry) => entry.clientId === existingClientId)?.email || "Not set" }),
          h(InfoTile, { label: "Job Address", value: data.clients.find((entry) => entry.clientId === existingClientId)?.address || "Not set" })
        ),
        h(ActionButton, { label: "Create Quote & Load Room Options", onClick: () => selectOrCreateQuote("existing"), icon: ClipboardList, className: "mt-4 w-full" })
      ),
      h("p", { className: "mt-6 text-center text-sm text-slate-500" }, "Room Quoter")
    );
  }

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.2fr_0.8fr]" },
    h("section", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Room"),
        h("div", { className: "mt-4 grid grid-cols-3 gap-3 xl:grid-cols-4" },
          ROOM_PRESETS.map((room) => {
            const Icon = ROOM_ICONS[room.label] || Briefcase;
            return h(SelectCard, {
              key: room.key,
              active: draft.roomPreset === room.key,
              label: room.label,
              icon: Icon,
              onClick: () => patch("roomPreset", room.key)
            });
          })
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
          h("div", { className: "auty-glass-slider mx-auto mt-4 max-w-sm", style: { "--segment-count": 2 } },
            ["Yes", "No"].map((value) => h(SelectPill, { key: value, glass: true, active: draft.ceiling === value, label: value, onClick: () => patch("ceiling", value) }))
          ),
          ceilingNotesOpen && h("div", { className: "mt-4" }, h(Field, { label: "Ceiling Notes", value: draft.ceilingNotes, textarea: true, onChange: (value) => patch("ceilingNotes", value) }))
        ),
        h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
          h("h3", { className: "text-lg font-black text-slate-900" }, "Room Woodwork"),
          [["Skirting Boards", "skirtingBoards", "room"], ["Architrave", "architrave", "room"], ["Doors", "doors", "room"], ["Window Sill", "windowSill", "feature"]].map(([label, key, source]) => h("div", { key, className: "mt-4 rounded-[22px] border border-white/70 bg-white/24 p-3 backdrop-blur-xl" },
            h("p", { className: "text-center text-sm text-slate-900" }, label),
            h("div", { className: "auty-glass-slider mt-3", style: { "--segment-count": TOGGLE_THREE.length } }, TOGGLE_THREE.map((value) => h(SelectPill, {
              key: value,
              glass: true,
              active: (source === "feature" ? draft.otherFeatures[key] : draft[key]) === value,
              label: value,
              onClick: () => source === "feature" ? patchFeature(key, value) : patch(key, value)
            })))
          )),
          woodworkActive && h("div", { className: "mt-4" }, h(Field, { label: "Woodwork Notes", value: draft.woodworkNotes, textarea: true, onChange: (value) => patch("woodworkNotes", value) }))
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Other Features"),
        h("div", { className: "mx-auto mt-4 grid max-w-2xl gap-3" },
          OTHER_FEATURE_KEYS.filter(([key]) => key !== "windowSill").map(([key, label]) => h("div", { key, className: "auty-feature-control rounded-[22px] border border-white/70 bg-white/28 p-4 text-center" },
            h("p", { className: "text-center text-sm text-slate-900" }, label),
            h("div", { className: "auty-glass-slider mx-auto mt-3 max-w-md", style: { "--segment-count": TOGGLE_THREE.length } }, TOGGLE_THREE.map((value) => h(SelectPill, { key: value, glass: true, active: draft.otherFeatures[key] === value, label: value, onClick: () => patchFeature(key, value) })))
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
          h(Field, { label: "Materials Cost", value: draft.materialsCost, type: "number", prefix: "£", onChange: (value) => patch("materialsCost", value) }),
          h(Field, { label: "Include Materials In Quote", value: draft.includeMaterials, options: ["Yes", "No"], onChange: (value) => patch("includeMaterials", value) })
        )
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/34 p-5" },
        h("h3", { className: "text-lg text-slate-900" }, "Attach Room Images"),
        h("p", { className: "mt-1 text-sm text-slate-500" }, "Choose a photo from your gallery or take a new one. It will stay linked to this quote and room."),
        h("div", { className: "mt-4 grid grid-cols-2 gap-3" },
          h("label", { className: "flex min-h-[88px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-white/80 bg-white/40 text-center text-sm text-slate-700" },
            h(ImagePlus, { size: 22, className: "mb-2 text-[#01717F]" }), "Photo Library",
            h("input", { type: "file", accept: "image/*", className: "hidden", onChange: (event) => attachRoomPhoto(event.target.files?.[0]) })
          ),
          h("label", { className: "flex min-h-[88px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-white/80 bg-white/40 text-center text-sm text-slate-700" },
            h(Upload, { size: 22, className: "mb-2 text-[#C88933]" }), "Take Photo",
            h("input", { type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: (event) => attachRoomPhoto(event.target.files?.[0]) })
          )
        )
      )
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "auty-dark-glass rounded-[30px] border border-white/70 p-5 text-white" },
        h("h3", { className: "text-lg font-black" }, "Room Estimate In Time"),
        h("div", { className: "mt-4 flex flex-wrap gap-2" }, TIME_OPTIONS.map((option) => h(SelectPill, {
          key: option.label,
          active: draft.estimatedDays === option.value,
          label: option.label,
          inverse: true,
          onClick: () => patch("estimatedDays", option.value)
        }))),
        h("h3", { className: "mt-6 text-lg font-black" }, "Price Adjustment"),
        h("div", { className: "mt-4 flex flex-wrap gap-2" }, ADJUSTMENT_OPTIONS.map((option) => h(SelectPill, {
          key: option.label,
          active: draft.adjustmentFactor === option.value,
          label: option.label,
          inverse: true,
          onClick: () => patch("adjustmentFactor", option.value)
        }))),
        h("div", { className: "mt-6 rounded-[24px] bg-white/10 p-4" },
          h("p", { className: "text-sm font-bold uppercase tracking-[0.2em] text-amber-200" }, "Final Room Price"),
          h("p", { className: "auty-emphasis mt-2 text-4xl" }, money(finalRoomPrice)),
          h("p", { className: "mt-2 text-sm text-white/72" }, `Auto price ${money(autoPrice)} | ${draft.estimatedDays} day(s) at ${money(data.settings.dayRate)} per day`)
        ),
        h("div", { className: "mt-4" }, h(Field, { label: "Override Price", value: draft.overridePrice, type: "number", prefix: "£", inverse: true, onChange: (value) => patch("overridePrice", value) })),
        h(ActionButton, { label: "Complete Room", onClick: completeRoom, icon: Save, variant: "gold", className: "mt-5 w-full" })
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
            ),
            h("button", { type: "button", onClick: () => setJobTab("Job Overview"), className: "mt-3 w-full rounded-full bg-[#01717F] px-4 py-2 text-sm text-white hover:bg-[#006878]" }, "Go to Job Overview")
          ))
        ) : h(EmptyState, { title: "No rooms added yet", body: "Complete a room and it will appear here straight away." })
      )
    ),
    h("div", { className: "rounded-[30px] border border-white/70 bg-white/30 p-5 text-center xl:col-span-2" },
      h("p", { className: "text-sm text-slate-500" }, quote ? `${quote.quoteReference} · ${displayName(client)}` : "Quote controls"),
      h("div", { className: "mt-4 grid gap-2 sm:grid-cols-2" },
        h(ActionButton, { label: "Start Another Quote", onClick: startAnotherQuote, icon: UserPlus, variant: "soft", className: "w-full" }),
        h(ActionButton, { label: "Clear Form", onClick: clearForm, icon: Trash2, variant: "danger", className: "w-full" })
      )
    )
  );
}

function JobOverviewPage({ data, selectedClient, selectedQuote, upsert, removeItem, saveQuoteTotals, generatePdf, setNotice, setSelectedQuoteId, setJobTab }) {
  const [editingClient, setEditingClient] = useState(false);
  if (!selectedQuote) return h(EmptyState, { title: "No current quote selected", body: "Start a quote in Room Quoter or pick a client with an existing job." });
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

  const discardEmptyDraft = () => {
    removeItem("quotes", "quoteId", selectedQuote.quoteId);
    setSelectedQuoteId("");
    setJobTab("Room Quoter");
    setNotice("Empty draft discarded");
  };

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.15fr_0.85fr]" },
    h("section", { className: "space-y-5" },
      h("div", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("div", null,
            h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Job Overview"),
            h("h2", { className: "text-2xl font-black text-slate-900" }, selectedQuote.quoteReference)
          ),
          h(IconButton, { label: editingClient ? "Finish editing client" : "Edit client", icon: editingClient ? Save : SquarePen, onClick: () => setEditingClient(!editingClient) })
        ),
        h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
          editingClient
            ? h(React.Fragment, null,
              h(Field, { label: "Surname", value: client?.surname || "", onChange: (value) => updateClient({ surname: value }) }),
              h(Field, { label: "Given Name", value: client?.givenName || "", onChange: (value) => updateClient({ givenName: value }) }),
              h(Field, { label: "Telephone", value: client?.telephone || "", onChange: (value) => updateClient({ telephone: value }) }),
              h(Field, { label: "Email", value: client?.email || "", type: "email", onChange: (value) => updateClient({ email: value }) }),
              h("div", { className: "lg:col-span-2" }, h(Field, { label: "Address", value: client?.address || "", textarea: true, onChange: (value) => updateClient({ address: value }) }))
            )
            : h(React.Fragment, null,
              h(InfoTile, { label: "Client", value: client ? databaseName(client) : "Unknown client" }),
              h(InfoTile, { label: "Display Name", value: client ? displayName(client) : "Unknown client" }),
              h(InfoTile, { label: "Address", value: client?.address || "Not set" }),
              h(InfoTile, { label: "Telephone", value: client?.telephone || "Not set" }),
              h(InfoTile, { label: "Email", value: client?.email || "Not set" })
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
                h(IconButton, { label: `Delete ${room.roomName || "room"}`, icon: Trash2, onClick: () => deleteRoom(room.roomId) })
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
          h(Field, { label: "Overall Discount", value: selectedQuote.discountType, options: ["No Discount", "5%", "10%", "15%", "20%", "Custom"], onChange: (value) => updateQuote({ discountType: value, discountPercent: value === "Custom" || value === "No Discount" ? 0 : Number(value.replace("%", "")) }) }),
          selectedQuote.discountType === "Custom" && h(Field, { label: "Custom Discount", value: selectedQuote.customDiscount, type: "number", onChange: (value) => updateQuote({ customDiscount: value }) }),
          h(Field, { label: "VAT", value: selectedQuote.vatEnabled ? "Enabled" : "Disabled", options: ["Enabled", "Disabled"], onChange: (value) => updateQuote({ vatEnabled: value === "Enabled" }) }),
          h(Field, { label: "Deposit Due Now", value: selectedQuote.depositType, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%", "Fixed Amount", "Custom"], onChange: (value) => updateQuote({ depositType: value }) }),
          (selectedQuote.depositType === "Fixed Amount" || selectedQuote.depositType === "Custom") && h(Field, { label: "Deposit Amount", value: selectedQuote.depositCustom, type: "number", onChange: (value) => updateQuote({ depositCustom: value }) }),
          h("div", { className: "lg:col-span-2" }, h(Field, { label: "Whole Job Specifics", value: selectedQuote.wholeJobSpecifics, textarea: true, onChange: (value) => updateQuote({ wholeJobSpecifics: value }) })),
          h("div", { className: "lg:col-span-2" }, h(Field, { label: "Final Notes", value: selectedQuote.finalNotes, textarea: true, onChange: (value) => updateQuote({ finalNotes: value }) }))
        ),
        h("div", { className: "mt-4" }, h(ReminderComposer, { upsert, setNotice, clientId: client?.clientId, quoteId: selectedQuote.quoteId }))
      ),
      selectedQuote.quoteStatus === "Draft" && !rooms.length && h(ActionButton, { label: "Discard Empty Draft", onClick: discardEmptyDraft, icon: Trash2, variant: "danger", className: "w-full" })
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "auty-dark-glass rounded-[30px] border border-white/70 p-5 text-white" },
        h("h3", { className: "text-lg font-black" }, "Job Totals"),
        h("div", { className: "mt-4 rounded-[24px] border border-white/20 bg-white/14 p-4 text-center" },
          h("p", { className: "text-xs uppercase tracking-[0.2em] text-white/70" }, "Total Job Price"),
          h("p", { className: "auty-emphasis mt-2 text-4xl text-white sm:text-5xl" }, money(calc.total))
        ),
        h("div", { className: "mt-4 space-y-3 text-sm" },
          [["Labour subtotal", calc.labourSubtotal], ["Materials total", calc.materialsTotal], ["Subtotal before discount", calc.subtotalBeforeDiscount], ["Discount", -calc.discountAmount], ["Subtotal after discount", calc.subtotalAfterDiscount], ["VAT", calc.vatAmount], ["Job total", calc.total], ["Deposit due now", calc.depositAmount], ["Remainder due on completion", calc.remainderAmount]].map(([label, value], index) => h("div", {
            key: label,
            "data-total-row": label,
            className: classNames("auty-total-row flex items-center justify-between gap-3 rounded-[18px] px-4 py-3", label === "Job total" ? "auty-total-row--job text-base" : "", label === "Deposit due now" ? "auty-total-row--deposit" : ""),
            style: { "--row-tint": ["rgba(0,136,152,.18)", "rgba(162,202,206,.18)", "rgba(255,255,255,.1)", "rgba(200,137,51,.13)", "rgba(1,113,127,.17)", "rgba(41,62,72,.2)"][index % 6] }
          }, h("span", null, label), h("strong", { className: label === "Job total" ? "auty-emphasis" : "" }, money(value))))
        ),
        h("p", { className: "mt-4 text-sm text-white/72" }, `Estimated duration ${calc.duration} day(s) | Completion ${shortDate(calc.completionDate)}`),
        h(ActionButton, { label: "Generate Quote PDF", onClick: () => generatePdf("quote", selectedQuote), icon: Download, className: "mt-5 w-full" })
      )
    )
  );
}

function InvoiceGeneratorPage({ data, upsert, removeItem, selectedQuote, generatePdf, setNotice }) {
  const [quoteId, setQuoteId] = useState(selectedQuote?.quoteId || data.quotes[0]?.quoteId || "");
  useEffect(() => {
    if (selectedQuote?.quoteId) setQuoteId(selectedQuote.quoteId);
  }, [selectedQuote?.quoteId]);
  const quote = data.quotes.find((entry) => entry.quoteId === quoteId) || selectedQuote || data.quotes[0];
  const calc = quote ? calculateQuote(quote, data.rooms, data.settings) : null;
  const client = data.clients.find((entry) => entry.clientId === quote?.clientId);
  const existingInvoice = data.invoices.find((invoice) => invoice.quoteId === quote?.quoteId);
  const relatedInvoices = data.invoices.filter((invoice) => invoice.clientId === quote?.clientId).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
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
      invoiceStatus: "Unpaid"
    });
  }, [quote?.quoteId, existingInvoice?.invoiceId, calc?.total, calc?.depositAmount]);

  if (!quote || !calc || !draftInvoice) return h(EmptyState, { title: "No quote ready for invoicing", body: "Create or select a quote first." });

  const saveAndGenerate = async () => {
    const invoice = { ...draftInvoice, jobTotal: calc.total, balanceDue: Math.max(0, calc.total - Number(draftInvoice.depositPaid)) };
    const errors = validateInvoice(invoice, quote, data.rooms, data.settings);
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    upsert("invoices", invoice, "invoiceId");
    await generatePdf("invoice", quote, invoice);
  };

  const deleteInvoice = (invoice) => {
    const ok = window.confirm(`Delete invoice ${invoice.invoiceReference}? This cannot be undone.`);
    if (!ok) return;
    removeItem("invoices", "invoiceId", invoice.invoiceId);
    setDraftInvoice({
      invoiceId: uid("invoice"),
      clientId: quote.clientId,
      quoteId: quote.quoteId,
      invoiceReference: nextReference("AUTY-INV", data.invoices.filter((entry) => entry.invoiceId !== invoice.invoiceId), "invoiceReference"),
      invoiceDate: today(),
      jobTotal: calc.total,
      depositPaid: calc.depositAmount,
      balanceDue: Math.max(0, calc.total - calc.depositAmount),
      paymentDueDate: addDays(today(), 14),
      invoiceStatus: "Unpaid"
    });
    setNotice("Invoice deleted");
  };

  const applyInvoiceStatus = (status, invoice = draftInvoice) => {
    const jobTotal = Number(invoice.jobTotal ?? calc.total);
    const amountPaid = status === "Paid" ? jobTotal : Number(invoice.depositPaid || 0);
    const updated = {
      ...invoice,
      invoiceStatus: status,
      depositPaid: amountPaid,
      balanceDue: Math.max(0, jobTotal - amountPaid)
    };
    upsert("invoices", updated, "invoiceId");
    if (invoice.invoiceId === draftInvoice.invoiceId) setDraftInvoice(updated);
    setNotice(`Invoice marked ${status.toLowerCase()}`);
  };

  return h("div", { className: "grid gap-5 xl:grid-cols-[1.05fr_0.95fr]" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Invoice Generator"),
      h("h2", { className: "text-2xl font-black text-slate-900" }, "Final invoice layout"),
      h("div", { className: "mt-4 grid gap-4 lg:grid-cols-2" },
        h(Field, { label: "Quote To Invoice", value: quote.quoteId, options: data.quotes.map((entry) => ({ value: entry.quoteId, label: `${entry.quoteReference} - ${displayName(data.clients.find((clientEntry) => clientEntry.clientId === entry.clientId))}` })), onChange: setQuoteId }),
        h(Field, { label: "Invoice Reference", value: draftInvoice.invoiceReference, onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceReference: value }) }),
        h(Field, { label: "Invoice Date", value: draftInvoice.invoiceDate, type: "date", onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceDate: value }) }),
        h(Field, { label: "Payment Due Date", value: draftInvoice.paymentDueDate, type: "date", onChange: (value) => setDraftInvoice({ ...draftInvoice, paymentDueDate: value }) }),
        h(Field, { label: "Deposit Paid", value: draftInvoice.depositPaid, type: "number", onChange: (value) => setDraftInvoice({ ...draftInvoice, depositPaid: value, balanceDue: Math.max(0, calc.total - Number(value)) }) }),
        h(Field, { label: "Invoice Status", value: draftInvoice.invoiceStatus === "Invoice Due" ? "Unpaid" : draftInvoice.invoiceStatus === "Part Paid" ? "Part-paid" : draftInvoice.invoiceStatus, options: ["Draft", "Sent", "Unpaid", "Part-paid", "Paid", "Overdue"], onChange: (value) => setDraftInvoice({ ...draftInvoice, invoiceStatus: value }) })
      ),
      h("div", { className: "mt-4" },
        h("p", { className: "text-sm text-slate-600" }, "Quick status"),
        h(InvoiceStatusControls, { status: draftInvoice.invoiceStatus, onChange: (status) => applyInvoiceStatus(status) }),
        h(PaymentChaseButtons, { invoice: draftInvoice, client, settings: data.settings }),
        h("div", { className: "mt-3" }, h(ReminderComposer, { upsert, setNotice, clientId: client?.clientId, quoteId: quote.quoteId, invoiceId: draftInvoice.invoiceId }))
      ),
      h("div", { className: "mt-5 grid gap-3 sm:grid-cols-2" },
        h(InfoTile, { label: "Client", value: client ? displayName(client) : "Unknown client" }),
        h(InfoTile, { label: "Job Address", value: client?.address || "Not set" }),
        h(InfoTile, { label: "Original Quote", value: quote.quoteReference }),
        h(InfoTile, { label: "Completed Work Summary", value: quote.wholeJobSpecifics || "No summary added yet" })
      )
    ),
    h("aside", { className: "space-y-5" },
      h("div", { className: "auty-dark-glass rounded-[30px] border border-white/70 p-5 text-white" },
        h("h3", { className: "text-lg font-black" }, "Invoice Totals"),
        h("div", { className: "mt-4 space-y-3 text-sm" },
          [["Final job total", calc.total], ["Deposit paid", draftInvoice.depositPaid], ["Remaining balance", draftInvoice.balanceDue], ["VAT breakdown", calc.vatAmount]].map(([label, value]) => h("div", { key: label, className: "flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3" }, h("span", null, label), h("strong", null, money(value))))
        ),
        h("p", { className: "mt-4 text-sm text-white/72" }, `Payment due by ${shortDate(draftInvoice.paymentDueDate)}`),
        h(ActionButton, { label: "Generate Final Invoice", onClick: saveAndGenerate, icon: FileText, className: "mt-5 w-full" })
      ),
      h("div", { className: "rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.48))] p-5 shadow-[0_22px_55px_rgba(24,34,48,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl" },
        h("h3", { className: "text-lg font-black text-slate-900" }, "Past Invoices"),
        relatedInvoices.length ? h("div", { className: "mt-4 space-y-3" },
          relatedInvoices.map((invoice) => h("div", { key: invoice.invoiceId, "data-invoice-id": invoice.invoiceId, className: "rounded-[22px] bg-white/42 p-4 shadow-sm" },
            h("div", { className: "flex items-start justify-between gap-3" },
              h("div", null,
                h("p", { className: "font-black text-slate-900" }, invoice.invoiceReference),
                h("p", { className: "text-sm text-slate-500" }, `${shortDate(invoice.invoiceDate)} | ${invoice.invoiceStatus === "Invoice Due" ? "Unpaid" : invoice.invoiceStatus}`),
                h("p", { className: "mt-1 text-sm text-slate-600" }, `${money(invoice.balanceDue ?? invoice.jobTotal)} outstanding`)
              ),
              h(IconButton, { label: `Delete invoice ${invoice.invoiceReference}`, icon: Trash2, onClick: () => deleteInvoice(invoice) })
            ),
            h(InvoiceStatusControls, { status: invoice.invoiceStatus, onChange: (status) => applyInvoiceStatus(status, invoice) }),
            h(PaymentChaseButtons, { invoice, client, settings: data.settings })
          ))
        ) : h(EmptyState, { title: "No saved invoices yet", body: "Generate one and it will appear here." })
      )
    )
  );
}

function PhotosPage({ data, upsert, selectedClient, selectedQuote, setNotice, workspaceActions, isCloud }) {
  const [form, setForm] = useState({ clientId: selectedClient?.clientId || "", quoteId: selectedQuote?.quoteId || "", roomId: "", photoType: "Before", caption: "" });
  useEffect(() => {
    setForm((current) => ({
      ...current,
      clientId: selectedClient?.clientId || current.clientId,
      quoteId: selectedQuote?.quoteId || current.quoteId
    }));
  }, [selectedClient?.clientId, selectedQuote?.quoteId]);

  const rooms = data.rooms.filter((room) => !form.quoteId || room.quoteId === form.quoteId);

  const uploadFile = async (file) => {
    const errors = validatePhotoUpload(file, form);
    if (errors.length) {
      setNotice(formatErrors(errors));
      return;
    }
    try {
      const photo = await workspaceActions.uploadPhotoFile(file, form);
      upsert("photos", photo, "photoId");
      setForm({ ...form, caption: "" });
      setNotice(isCloud ? "Photo uploaded to cloud storage" : "Photo attached in preview mode");
    } catch (error) {
      setNotice(error.message || "Photo upload failed");
    }
  };

  return h("div", { className: "space-y-5" },
    h("section", { className: "rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur" },
      h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Photos & Attachments"),
      h("h2", { className: "text-2xl font-black text-slate-900" }, "Attach room-specific progress photos"),
      h("p", { className: "mt-2 text-sm text-slate-500" }, "Uploads now target Supabase Storage when cloud mode is active. Files are limited to 5 MB and stay tied to client, quote and room."),
      h("div", { className: "mt-4 grid gap-4 lg:grid-cols-3" },
        h(Field, { label: "Assigned Client", value: form.clientId, options: [{ value: "", label: "Choose client" }, ...data.clients.map((client) => ({ value: client.clientId, label: databaseName(client) }))], onChange: (value) => setForm({ ...form, clientId: value }) }),
        h(Field, { label: "Assigned Quote / Job", value: form.quoteId, options: [{ value: "", label: "Choose quote" }, ...data.quotes.filter((quote) => !form.clientId || quote.clientId === form.clientId).map((quote) => ({ value: quote.quoteId, label: quote.quoteReference }))], onChange: (value) => setForm({ ...form, quoteId: value, roomId: "" }) }),
        h(Field, { label: "Assigned Room", value: form.roomId, options: [{ value: "", label: "Choose room" }, ...rooms.map((room) => ({ value: room.roomId, label: room.roomName }))], onChange: (value) => setForm({ ...form, roomId: value }) }),
        h(Field, { label: "Photo Type", value: form.photoType, options: PHOTO_TYPES, onChange: (value) => setForm({ ...form, photoType: value }) }),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Caption", value: form.caption, onChange: (value) => setForm({ ...form, caption: value }) })),
        h("label", { className: "grid min-h-[150px] cursor-pointer place-items-center rounded-[24px] border-2 border-dashed border-white/80 bg-white/40 p-4 text-center transition hover:border-[#01717F] hover:bg-white/65" },
          h("div", null,
            h(Upload, { size: 24, className: "mx-auto text-auty-gold" }),
            h("p", { className: "mt-3 font-black text-slate-900" }, "Upload photo"),
            h("p", { className: "text-sm text-slate-500" }, "Before, during, after, materials, or damage images")
          ),
          h("input", { type: "file", accept: "image/*", className: "hidden", onChange: (event) => uploadFile(event.target.files?.[0]) })
        )
      )
    ),
    data.photos.length ? h("section", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" },
      data.photos.map((photo) => {
        const client = data.clients.find((entry) => entry.clientId === photo.clientId);
        const room = data.rooms.find((entry) => entry.roomId === photo.roomId);
        return h("article", { key: photo.photoId, className: "overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_18px_45px_rgba(24,34,48,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1" },
          h("img", { src: photo.imageUrl || photo.imageData, alt: photo.caption || photo.photoType, className: "h-60 w-full object-cover" }),
          h("div", { className: "p-4" },
            h("span", { className: classNames("inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1", calendarTint(photo.photoType === "Before" ? "Quote Visit" : photo.photoType === "After" ? "Booked Job" : "Potential Job (Unconfirmed)")) }, photo.photoType),
            h("p", { className: "mt-3 font-black text-slate-900" }, photo.caption || "No caption"),
            h("p", { className: "mt-1 text-sm text-slate-500" }, `${displayName(client)} | ${room?.roomName || "Room"} | ${shortDate(photo.uploadedDate)}`)
          )
        );
      })
    ) : h(EmptyState, { title: "No photos yet", body: "Upload a room photo and it will be attached to the current job." })
  );
}

function SettingsPanel({ data, update, setShowSettings, setNotice, installToHomeScreen, darkMode, exportBackup, importBackupFile, uploadLogoFile, signOutUser, session, isCloud }) {
  const settings = data.settings;
  const patch = (field, value) => update("settings", { ...settings, [field]: value });

  return h("div", { className: "fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,210,145,0.18),transparent_26%),rgba(15,23,42,0.36)] p-4 backdrop-blur-md" },
    h("div", { className: classNames(
      "mx-auto mt-2 max-h-[calc(100vh-2rem)] w-[min(94vw,860px)] overflow-y-auto rounded-[34px] p-5 shadow-[0_30px_80px_rgba(24,34,48,0.22),0_0_60px_rgba(240,181,82,0.14),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl",
      darkMode ? "border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.88),rgba(30,41,59,0.7))]" : "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.56))]"
    ) },
      h("div", { className: "flex items-center justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-auty-gold" }, "Settings"),
          h("h2", { className: classNames("text-2xl font-black", darkMode ? "text-white" : "text-slate-900") }, "Workspace settings and backups"),
          h("p", { className: classNames("mt-1 text-sm", darkMode ? "text-white/65" : "text-slate-500") }, isCloud ? `Cloud account: ${session?.user?.email || "Signed in"}` : "Preview mode is active until Supabase is configured.")
        ),
        h(IconButton, { label: "Close settings", icon: X, onClick: () => setShowSettings(false) })
      ),
      h("div", { className: "mt-5 grid gap-4 lg:grid-cols-2" },
        h(Field, { label: "Business Name", value: settings.businessName, onChange: (value) => patch("businessName", value) }),
        h(Field, { label: "Decorator Name", value: settings.decoratorName || "", onChange: (value) => patch("decoratorName", value) }),
        h(Field, { label: "Standard Day Rate", value: settings.dayRate, type: "number", onChange: (value) => patch("dayRate", value) }),
        h(Field, { label: "VAT Enabled", value: settings.vatEnabled ? "Yes" : "No", options: ["Yes", "No"], onChange: (value) => patch("vatEnabled", value === "Yes") }),
        h(Field, { label: "VAT Rate", value: settings.vatRate, type: "number", onChange: (value) => patch("vatRate", value) }),
        h(Field, { label: "Default Deposit", value: settings.defaultDeposit, options: ["No Deposit", "10%", "20%", "25%", "30%", "50%"], onChange: (value) => patch("defaultDeposit", value) }),
        h(Field, { label: "Theme Mode", value: settings.themeMode || "Light", options: ["Light", "Dark"], onChange: (value) => patch("themeMode", value) }),
        h(Field, { label: "Business Telephone", value: settings.businessTelephone, onChange: (value) => patch("businessTelephone", value) }),
        h(Field, { label: "Business Email", value: settings.businessEmail, onChange: (value) => patch("businessEmail", value) }),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Business Address", value: settings.businessAddress, textarea: true, onChange: (value) => patch("businessAddress", value) })),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Payment Details", value: settings.paymentDetails, textarea: true, onChange: (value) => patch("paymentDetails", value) })),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Payment Terms", value: settings.paymentTerms, textarea: true, onChange: (value) => patch("paymentTerms", value) })),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Quotation Terms", value: settings.quoteTerms, textarea: true, onChange: (value) => patch("quoteTerms", value) })),
        h("div", { className: "lg:col-span-2" }, h(Field, { label: "Acceptance Notes", value: settings.acceptanceNotes, textarea: true, onChange: (value) => patch("acceptanceNotes", value) })),
        h(Field, { label: "Calendar Sync Provider", value: settings.calendarSyncProvider || "", options: ["", "Google Calendar", "Apple Calendar"], onChange: (value) => patch("calendarSyncProvider", value) }),
        h(Field, { label: "Calendar Sync Ready", value: settings.calendarSyncEnabled ? "Yes" : "No", options: ["Yes", "No"], onChange: (value) => patch("calendarSyncEnabled", value === "Yes") }),
        h("div", { className: classNames(
          "lg:col-span-2 rounded-[24px] p-4",
          darkMode ? "border border-white/10 bg-[linear-gradient(135deg,rgba(10,15,31,0.86),rgba(0,184,198,0.12))]" : "border border-slate-200 bg-[linear-gradient(135deg,#fff8ee,#f5faff)]"
        ) },
          h("p", { className: classNames("text-sm font-black", darkMode ? "text-white" : "text-slate-900") }, "Business Logo"),
          h("p", { className: classNames("mt-1 text-sm", darkMode ? "text-white/65" : "text-slate-500") }, "Used in quotation and invoice PDFs."),
          h("img", { src: resolveBrandLogo(settings, darkMode), alt: "Business logo", className: "mt-3 h-20 rounded-2xl bg-white p-2 shadow-sm" }),
          h("label", { className: classNames(
            "mt-4 inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5",
            darkMode ? "bg-[#008898] hover:bg-[#006878]" : "bg-[#293E48] hover:bg-[#172b34]"
          ) },
            h(ImagePlus, { size: 18 }),
            "Upload Logo",
            h("input", { type: "file", accept: "image/*", className: "hidden", onChange: (event) => uploadLogoFile(event.target.files?.[0]) })
          )
        )
      ),
      h("div", { className: "mt-5 flex flex-wrap gap-3" },
        h(ActionButton, { label: "Add App To Home Screen", onClick: installToHomeScreen, icon: Home, variant: "soft" }),
        h(ActionButton, { label: "Export JSON Backup", onClick: exportBackup, icon: Download }),
        h("label", { className: "inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-[20px] bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800" },
          h(Upload, { size: 18 }),
          "Import JSON Backup",
          h("input", { type: "file", accept: "application/json", className: "hidden", onChange: (event) => importBackupFile(event.target.files?.[0]) })
        ),
        isCloud && h(ActionButton, { label: "Sign Out", onClick: signOutUser, icon: LogOut, variant: "danger" })
      )
    )
  );
}

function DashboardAction({ label, onClick, icon: Icon, disabled = false, accent = false }) {
  return h("button", {
    type: "button",
    onClick,
    disabled,
    className: classNames(
      "flex min-h-[72px] flex-col items-start justify-between rounded-[20px] border border-white/70 p-3 text-left transition",
      disabled ? "cursor-not-allowed bg-white/20 text-slate-400 opacity-60" : accent ? "bg-[#C88933] text-white hover:bg-[#ad7228]" : "bg-white/42 text-slate-800 hover:bg-white/70"
    )
  }, h(Icon, { size: 19 }), h("span", { className: "mt-2 text-xs sm:text-sm" }, label));
}

function DashboardList({ title, count, items, empty }) {
  return h("div", { className: "rounded-[28px] border border-white/70 bg-white/30 p-5" },
    h("div", { className: "flex items-center justify-between gap-3" },
      h("h3", { className: "text-lg text-slate-900" }, title),
      h("span", { className: "grid h-8 min-w-8 place-items-center rounded-full bg-[#01717F] px-2 text-xs text-white" }, count)
    ),
    items.length ? h("div", { className: "mt-4 space-y-2" }, items.map((item) => h("button", {
      key: item.id,
      type: "button",
      onClick: item.onClick,
      className: "flex w-full items-center justify-between gap-3 rounded-[20px] border border-white/70 bg-white/38 p-3 text-left transition hover:bg-white/68"
    },
      h("span", { className: "min-w-0" },
        h("span", { className: "block truncate text-sm text-slate-900" }, item.title),
        h("span", { className: "mt-1 block truncate text-xs text-slate-500" }, item.detail)
      ),
      h("span", { className: "shrink-0 text-right" },
        h("span", { className: "block text-sm text-slate-800" }, item.value),
        h("span", { className: "mt-1 block text-[11px] text-[#01717F]" }, item.status)
      )
    ))) : h("p", { className: "mt-4 rounded-[20px] border border-dashed border-white/80 bg-white/20 p-4 text-sm text-slate-500" }, empty)
  );
}

function InvoiceStatusControls({ status, onChange }) {
  const current = status === "Invoice Due" ? "Unpaid" : status;
  const colours = {
    Unpaid: "#293E48",
    Paid: "#01717F",
    Overdue: "#C88933"
  };
  return h("div", { className: "mt-3 grid grid-cols-3 gap-2", role: "group", "aria-label": "Invoice payment status" },
    ["Unpaid", "Paid", "Overdue"].map((option) => h("button", {
      key: option,
      type: "button",
      "aria-pressed": current === option,
      onClick: () => onChange(option),
      className: classNames("rounded-full border px-3 py-2 text-xs transition", current === option ? "border-transparent text-white shadow-sm" : "border-white/80 bg-white/36 text-slate-600 hover:bg-white/68"),
      style: current === option ? { backgroundColor: colours[option] } : undefined
    }, option))
  );
}

function paymentEmailContent(kind, invoice, client, settings) {
  const values = {
    clientName: displayName(client),
    decoratorName: settings.decoratorName || settings.businessName || "AUTY Decorating",
    invoiceNumber: invoice.invoiceReference,
    invoiceTotal: money(invoice.jobTotal),
    outstandingBalance: money(invoice.balanceDue),
    dueDate: shortDate(invoice.paymentDueDate),
    jobAddress: client?.address || "the decorating work"
  };
  if (kind === "second") return {
    subject: `Second reminder for invoice ${values.invoiceNumber}`,
    body: `Hi ${values.clientName},\n\nI’m following up again regarding invoice ${values.invoiceNumber}, which is still showing as unpaid.\n\nThe outstanding balance is ${values.outstandingBalance}, and the due date was ${values.dueDate}.\n\nPlease arrange payment as soon as possible or let me know if there is an issue.\n\nKind regards,\n${values.decoratorName}`
  };
  if (kind === "final") return {
    subject: `Final notice for overdue invoice ${values.invoiceNumber}`,
    body: `Hi ${values.clientName},\n\nThis is a final notice regarding overdue invoice ${values.invoiceNumber} for ${values.jobAddress}.\n\nThe outstanding balance is ${values.outstandingBalance}. Payment was due on ${values.dueDate}.\n\nPlease arrange payment immediately to avoid further action.\n\nKind regards,\n${values.decoratorName}`
  };
  return {
    subject: `Payment reminder for invoice ${values.invoiceNumber}`,
    body: `Hi ${values.clientName},\n\nI hope you’re well. This is a quick reminder that invoice ${values.invoiceNumber} for ${values.jobAddress} is now due.\n\nThe outstanding balance is ${values.outstandingBalance}.\n\nPlease let me know once payment has been made.\n\nKind regards,\n${values.decoratorName}`
  };
}

function PaymentChaseButtons({ invoice, client, settings }) {
  const openDraft = (kind) => {
    if (!client?.email) {
      window.alert("Add the client email address before creating a payment email.");
      return;
    }
    const content = paymentEmailContent(kind, invoice, client, settings);
    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.body)}`;
  };
  const first = paymentEmailContent("first", invoice, client, settings);
  const second = paymentEmailContent("second", invoice, client, settings);
  const final = paymentEmailContent("final", invoice, client, settings);
  return h("div", { className: "mt-4 grid gap-2 sm:grid-cols-3" },
    h("button", { type: "button", "data-email-subject": first.subject, "data-email-body": first.body, onClick: () => openDraft("first"), className: "rounded-full bg-[#01717F] px-3 py-2 text-xs text-white" }, "Chase Payment"),
    h("button", { type: "button", "data-email-subject": second.subject, "data-email-body": second.body, onClick: () => openDraft("second"), className: "rounded-full bg-[#293E48] px-3 py-2 text-xs text-white" }, "Second Payment Chase"),
    h("button", { type: "button", "data-email-subject": final.subject, "data-email-body": final.body, onClick: () => openDraft("final"), className: "rounded-full bg-[#C88933] px-3 py-2 text-xs text-white" }, "Final Notice")
  );
}

function ReminderComposer({ upsert, setNotice, clientId = "", quoteId = "", invoiceId = "" }) {
  const [open, setOpen] = useState(false);
  const [reminder, setReminder] = useState({ title: "", startDate: today(), startTime: "09:00", reminderType: invoiceId ? "Payment to chase" : quoteId ? "Quote follow-up" : "Upcoming appointment", notes: "", reminderStatus: "Pending" });
  const save = () => {
    if (!reminder.title.trim()) {
      setNotice("Add a reminder title");
      return;
    }
    upsert("calendarEntries", { ...reminder, calendarEntryId: uid("cal"), type: "Reminder", clientId, quoteId, invoiceId, endDate: reminder.startDate }, "calendarEntryId");
    setReminder({ ...reminder, title: "", notes: "" });
    setOpen(false);
    setNotice("Reminder saved");
  };
  return h("div", { className: "rounded-[24px] border border-white/70 bg-white/30 p-4" },
    h("button", { type: "button", onClick: () => setOpen(!open), className: "flex w-full items-center justify-between text-left text-sm text-slate-800" }, h("span", null, "Add Reminder"), h(ChevronDown, { size: 17, className: open ? "rotate-180" : "" })),
    open && h("div", { className: "mt-4 grid gap-3 sm:grid-cols-2" },
      h(Field, { label: "Reminder Title", value: reminder.title, onChange: (value) => setReminder({ ...reminder, title: value }) }),
      h(Field, { label: "Category", value: reminder.reminderType, options: ["Quote follow-up", "Payment to chase", "Job starting soon", "Upcoming appointment", "Materials to order", "Invoice overdue"], onChange: (value) => setReminder({ ...reminder, reminderType: value }) }),
      h(Field, { label: "Due Date", value: reminder.startDate, type: "date", onChange: (value) => setReminder({ ...reminder, startDate: value }) }),
      h(Field, { label: "Due Time", value: reminder.startTime, type: "time", onChange: (value) => setReminder({ ...reminder, startTime: value }) }),
      h(Field, { label: "Status", value: reminder.reminderStatus, options: ["Pending", "Completed", "Dismissed"], onChange: (value) => setReminder({ ...reminder, reminderStatus: value }) }),
      h("div", { className: "sm:col-span-2" }, h(Field, { label: "Notes", value: reminder.notes, textarea: true, onChange: (value) => setReminder({ ...reminder, notes: value }) })),
      h(ActionButton, { label: "Save Reminder", onClick: save, icon: Save, className: "sm:col-span-2 w-full" })
    )
  );
}

function Field({ id, label, value, onChange, type = "text", options, textarea, prefix = "", inverse = false }) {
  const base = "mt-2 w-full rounded-[20px] border border-slate-200 bg-white/92 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-auty-gold focus:ring-4 focus:ring-amber-100";
  const optionList = options?.map((option) => typeof option === "object" ? option : { value: option, label: option });
  const input = h("input", { id, type, step: type === "number" ? "0.01" : undefined, value: value ?? "", onChange: (event) => onChange(type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value), className: classNames(base, prefix ? "pl-9" : "") });
  return h("label", { className: classNames("block text-sm", inverse ? "text-white" : "text-slate-700") },
    label,
    options
      ? h("select", { id, value: value ?? "", onChange: (event) => onChange(event.target.value), className: base }, optionList.map((option) => h("option", { key: String(option.value), value: option.value }, option.label || "Not set")))
      : textarea
        ? h("textarea", { id, rows: 4, value: value ?? "", onChange: (event) => onChange(event.target.value), className: base })
        : prefix
          ? h("span", { className: "relative block" }, h("span", { className: "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-600" }, prefix), input)
          : input
  );
}

function ActionButton({ label, onClick, icon: Icon, variant = "primary", className = "" }) {
  const styles = variant === "danger"
    ? "bg-[#b54747] text-white hover:bg-[#9f3d3d]"
    : variant === "gold"
      ? "bg-[#C88933] text-white hover:bg-[#a96f27]"
    : variant === "soft"
      ? "bg-[#A2CACE] text-[#293E48] hover:bg-[#91bcc0]"
      : "bg-[#01717F] text-white hover:bg-[#006878]";
  return h("button", {
    onClick,
    className: classNames("inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-sm font-black transition duration-300 hover:-translate-y-0.5 hover:shadow-lg", styles, className)
  }, Icon && h(Icon, { size: 18 }), label);
}

function IconButton({ label, icon: Icon, onClick }) {
  return h("button", {
    type: "button",
    "aria-label": label,
    title: label,
    onClick,
    className: "grid h-11 w-11 place-items-center rounded-[18px] border border-white/60 bg-white/55 text-slate-700 shadow-[0_0_18px_rgba(255,255,255,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#293E48] hover:text-white"
  }, h(Icon, { size: 18 }));
}

function SelectPill({ label, active, onClick, inverse = false, glass = false }) {
  return h("button", {
    type: "button",
    "aria-pressed": active,
    "data-option": label,
    onClick,
    className: classNames(
      glass ? "auty-glass-segment px-3 py-2 text-sm" : "rounded-full px-4 py-2 text-sm transition duration-300",
      glass ? "" : inverse ? active ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white/78 hover:bg-white/16 hover:text-white" : active ? label === "Yes" ? "bg-[#2f8f6b] text-white shadow-md" : label === "Partial" ? "bg-[#C88933] text-white shadow-md" : "bg-[#293E48] text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    )
  }, label);
}

function SelectCard({ label, active, onClick, icon: Icon }) {
  return h("button", {
    type: "button",
    "aria-pressed": active,
    onClick,
    className: classNames(
      "flex min-h-[118px] flex-col items-center justify-center rounded-[24px] border p-4 text-center transition duration-300",
      active ? "border-[#01717F] bg-white/72 shadow-[0_14px_30px_rgba(1,113,127,0.14)]" : "border-white/80 bg-white/42 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md"
    )
  }, h(Icon, { size: 20, className: active ? "text-auty-gold" : "text-slate-400" }), h("p", { className: "mt-3 text-slate-900" }, label));
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
  if (!href) return h("span", { className: "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400" }, h(Icon, { size: 14 }), label);
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
