import { LOGO_BUCKET_FOLDER, PHOTO_BUCKET, PHOTO_BUCKET_FOLDER } from "./constants.js";
import { normaliseState, today, uid } from "./utils.js";
import { getSupabaseClient } from "./supabase.js";

const TABLES = {
  clients: { table: "clients", idField: "client_id" },
  quotes: { table: "quotes", idField: "quote_id" },
  rooms: { table: "rooms", idField: "room_id" },
  photos: { table: "photos", idField: "photo_id" },
  invoices: { table: "invoices", idField: "invoice_id" },
  calendarEntries: { table: "calendar_entries", idField: "calendar_entry_id" }
};

async function requireClient() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function camelCaseFromSnake(value) {
  return value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function stripTransientPayloadFields(key, item) {
  const payload = { ...(item || {}) };

  // Signed URLs expire. Store the durable storage path only and rehydrate the URL when data loads.
  if (key === "photos" && payload.storagePath) {
    delete payload.imageUrl;
  }

  return payload;
}

function settingsPayload(settings) {
  const payload = { ...(settings || {}) };

  // Logo signed URLs also expire, so only the storage path should be persisted in cloud mode.
  if (payload.logoPath) {
    delete payload.logoUrl;
  }

  return payload;
}

function rowPayload(key, idField, item, userId) {
  return {
    user_id: userId,
    [idField]: item[idField] || item[camelCaseFromSnake(idField)] || item.id || uid(key),
    payload: stripTransientPayloadFields(key, item),
    updated_at: new Date().toISOString()
  };
}

async function signedUrlFor(path) {
  if (!path) return "";
  const supabase = await requireClient();
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) throw error;
  return data?.signedUrl || "";
}

async function hydratePhotos(photos) {
  return Promise.all((photos || []).map(async (photo) => ({
    ...photo,
    imageUrl: photo.storagePath
      ? await signedUrlFor(photo.storagePath).catch(() => photo.imageUrl || "")
      : photo.imageUrl || photo.imageData || ""
  })));
}

async function hydrateSettings(settings) {
  if (!settings?.logoPath) return settings;
  return {
    ...settings,
    logoUrl: await signedUrlFor(settings.logoPath).catch(() => settings.logoUrl || "")
  };
}

export async function fetchWorkspaceData(userId) {
  const supabase = await requireClient();
  const tableQueries = Object.entries(TABLES).map(async ([key, config]) => {
    const { data, error } = await supabase
      .from(config.table)
      .select("payload")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return [key, (data || []).map((row) => row.payload)];
  });
  const settingsQuery = supabase
    .from("workspace_settings")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  const tableResults = await Promise.all(tableQueries);
  const { data: settingsRow, error: settingsError } = await settingsQuery;
  if (settingsError && settingsError.code !== "PGRST116") throw settingsError;

  const state = normaliseState(Object.fromEntries(tableResults));
  state.settings = normaliseState({ settings: settingsRow?.payload || {} }).settings;
  state.photos = await hydratePhotos(state.photos);
  state.settings = await hydrateSettings(state.settings);
  return state;
}

export async function upsertEntity(key, item, userId) {
  const supabase = await requireClient();
  const config = TABLES[key];
  if (!config) throw new Error(`Unknown entity ${key}`);
  const row = rowPayload(key, config.idField, item, userId);
  const { error } = await supabase.from(config.table).upsert(row);
  if (error) throw error;
  return item;
}

export async function deleteEntity(key, idValue, userId) {
  const supabase = await requireClient();
  const config = TABLES[key];
  if (!config) throw new Error(`Unknown entity ${key}`);

  let storagePath = "";
  if (key === "photos") {
    const { data, error } = await supabase
      .from(config.table)
      .select("payload")
      .eq(config.idField, idValue)
      .eq("user_id", userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    storagePath = data?.payload?.storagePath || "";
  }

  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.idField, idValue)
    .eq("user_id", userId);
  if (error) throw error;

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    if (storageError) console.warn("Photo record deleted, but storage cleanup failed:", storageError.message);
  }
}

export async function upsertSettings(settings, userId) {
  const supabase = await requireClient();
  const { error } = await supabase.from("workspace_settings").upsert({
    user_id: userId,
    payload: settingsPayload(settings),
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
  return settings;
}

export async function replaceWorkspaceData(data, userId) {
  const supabase = await requireClient();
  const orderedKeys = Object.keys(TABLES);
  for (const key of orderedKeys) {
    const config = TABLES[key];
    const { error } = await supabase.from(config.table).delete().eq("user_id", userId);
    if (error) throw error;
  }
  const { error: settingsDeleteError } = await supabase.from("workspace_settings").delete().eq("user_id", userId);
  if (settingsDeleteError) throw settingsDeleteError;

  for (const key of orderedKeys) {
    for (const item of data[key] || []) {
      await upsertEntity(key, item, userId);
    }
  }
  await upsertSettings(data.settings, userId);
}

export async function uploadPhoto(file, meta, userId) {
  const supabase = await requireClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const photoId = uid("photo");
  const storagePath = `${userId}/${PHOTO_BUCKET_FOLDER}/${meta.quoteId}/${photoId}.${extension}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, file, { upsert: true });
  if (error) throw error;
  const imageUrl = await signedUrlFor(storagePath);
  return {
    photoId,
    clientId: meta.clientId,
    quoteId: meta.quoteId,
    roomId: meta.roomId,
    storagePath,
    imageUrl,
    photoType: meta.photoType,
    caption: meta.caption,
    uploadedDate: today()
  };
}

export async function uploadLogo(file, userId) {
  const supabase = await requireClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const storagePath = `${userId}/${LOGO_BUCKET_FOLDER}/workspace-logo.${extension}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, file, { upsert: true });
  if (error) throw error;
  const logoUrl = await signedUrlFor(storagePath);
  return { logoPath: storagePath, logoUrl };
}

export async function signInWithPassword(email, password) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(email, password) {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = await requireClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = await requireClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function onAuthStateChange(callback) {
  const supabase = await requireClient();
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
