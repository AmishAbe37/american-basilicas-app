import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

// The same project and publishable key as the website (members/config.js). The publishable key is meant to be
// public; the database's security rules (supabase/schema.sql) decide what each signed-in member can do.
export const SUPABASE_URL = "https://doivutqhoggdacwbynsj.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_pMFfNsomIgvA5dG3Y7g9pg_8Imr1gEn";
export const BUCKET = "member-photos";

export const sb = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Keep the session fresh only while the app is open (Supabase's guidance for React Native).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (s) => (s === "active" ? sb.auth.startAutoRefresh() : sb.auth.stopAutoRefresh()));
}

/** Throws the Supabase error, or returns the data. */
export function must<T>(r: { data: T; error: any }): T {
  if (r.error) throw r.error;
  return r.data;
}
