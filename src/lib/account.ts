import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { Directory, File, Paths } from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { must, sb } from "./supabase";

// The account features of the website's My pilgrimage page (account.html, members/core.js, members/shell.js):
// order history and account deletion through the "account" edge function, and the gallery membership through
// the membership() and mark_welcomed() functions in schema.sql. Same calls, same wording, kept offline-first:
// the last answer is saved on the phone and shown when there's no signal.

export const SHOP_URL = "https://americanbasilicas.myshopify.com/collections/all";      // the site's "Browse the shop"
export const PRIVACY_URL = "https://americanbasilicas.org/privacy.html";
export const SUPPORT_EMAIL = "hello@americanbasilicas.org";

// ---------- types (the edge function's and membership()'s shapes) ----------
export type Money = { amount: string; currencyCode: string };
export type OrderItem = { title: string; quantity: number; variant: string; image: string };
export type Order = { name: string; date: string; status: string; statusUrl: string | null; total: Money | null; items: OrderItem[] };
export type OrdersResult = { email?: string; orders: Order[]; note?: string };
export type MembershipKind = "trial" | "subscriber" | "admin" | "expired";
export type Membership = {
  access: boolean; kind: MembershipKind; joined: string | null; free_until: string | null;
  paid_through: string | null; email: string | null; welcomed_at: string | null;
};

/** What a screen gets: the data (live or saved on the phone), when it was fetched, and why it isn't fresh. */
export type Loaded<T> = { data: T | null; at: string | null; fromCache: boolean; offline: boolean; error: string | null };

// ---------- small helpers ----------
const key = (what: string, uid: string) => `ab.${what}.${uid}`;      // the same ab.<what>.<uid> scheme as visits.tsx
export const isOnline = async () => { const n = await NetInfo.fetch(); return n.isConnected !== false && n.isInternetReachable !== false; };
const networky = (e: any) => e instanceof FunctionsFetchError || /network|fetch|timed? ?out|offline|connection|abort/i.test(String(e?.message || e));

/** As AB.fmtDate on the site: "Nov 24, 2026". */
export function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const t = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
  return t.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
export const daysLeft = (ts: string | null) => (ts ? Math.max(0, Math.ceil((new Date(ts).getTime() - Date.now()) / 86400000)) : 0);
export function money(m: Money | null) {
  if (!m) return "";
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currencyCode }).format(+m.amount); }
  catch { return `${m.amount} ${m.currencyCode}`; }
}

/** The "account" edge function, as members/core.js calls it, with the server's own error message when it sends one. */
async function accountFn<T>(action: "orders" | "delete"): Promise<T> {
  const { data, error } = await sb.functions.invoke("account", { body: { action } });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { const j = await error.context.json(); if (j?.error) msg = j.error; } catch {}
    }
    const e: any = new Error(msg); e.network = networky(error); throw e;
  }
  return data as T;
}

async function readCache<T>(k: string): Promise<{ at: string; data: T } | null> {
  try { const v = await AsyncStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
}

/** Fetch live when there's signal, keep the answer on the phone, fall back to the saved one. */
async function load<T>(k: string, fetcher: () => Promise<T>): Promise<Loaded<T>> {
  const saved = await readCache<T>(k);
  const fromSaved = (offline: boolean, error: string | null): Loaded<T> =>
    ({ data: saved?.data ?? null, at: saved?.at ?? null, fromCache: !!saved, offline, error });
  if (!(await isOnline())) return fromSaved(true, null);
  try {
    const data = await fetcher(), at = new Date().toISOString();
    AsyncStorage.setItem(k, JSON.stringify({ at, data })).catch(() => {});
    return { data, at, fromCache: false, offline: false, error: null };
  } catch (e: any) {
    return fromSaved(!!e?.network || networky(e), e?.message || String(e));
  }
}

// ---------- order history ----------
export const loadOrders = (uid: string) => load<OrdersResult>(key("orders", uid), async () => {
  const r = await accountFn<OrdersResult>("orders");
  return { ...r, orders: r?.orders || [] };
});

// ---------- gallery membership ----------
export async function fetchMembership(): Promise<Membership> {
  const rows = must(await sb.rpc("membership")) as Membership[] | null;
  return (rows && rows[0]) || { access: false, kind: "expired", joined: null, free_until: null, paid_through: null, email: null, welcomed_at: null };
}
export const loadMembership = (uid: string) => load<Membership>(key("membership", uid), fetchMembership);
export const markWelcomed = async () => { must(await sb.rpc("mark_welcomed")); };

/** Text pieces; `b` is shown bold (a date), as in AB.memberLine. */
export type Piece = string | { b: string };
/**
 * The site's one wording for where a member stands (AB.memberLine in members/shell.js), without the calls to
 * subscribe: there's no purchase in the app. The neutral line about where memberships are managed is added by
 * the screen.
 */
export function memberLine(m: Membership): { tag: string; text: Piece[] } {
  if (m.kind === "admin") return { tag: "Administrator", text: ["You have full access to the members’ gallery as a site administrator."] };
  if (m.kind === "subscriber") return { tag: "Subscriber", text: ["Thank you for subscribing. Your gallery access runs through ", { b: fmtDate(m.paid_through) }, " and renews with your membership."] };
  if (m.kind === "trial") {
    const d = daysLeft(m.free_until);
    return { tag: `Free for ${d} more day${d === 1 ? "" : "s"}`, text: ["The members’ gallery is included free until ", { b: fmtDate(m.free_until) },
      " — your first three months. After that, it’s for subscribers. Your own map, visits and photos stay free."] };
  }
  return { tag: "Subscribers only", text: ["Your free three months of the members’ gallery ended on ", { b: fmtDate(m.free_until) },
    ". Your own map, visits and photos stay free."] };
}

// ---------- hooks for the screens ----------
function useLoaded<T>(uid: string | null | undefined, loader: (uid: string) => Promise<Loaded<T>>) {
  const [state, setState] = useState<Loaded<T> & { loading: boolean }>({ data: null, at: null, fromCache: false, offline: false, error: null, loading: true });
  const reload = useCallback(async () => {
    if (!uid) { setState({ data: null, at: null, fromCache: false, offline: false, error: null, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    const r = await loader(uid);
    setState({ ...r, loading: false });
  }, [uid, loader]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
export const useOrders = (uid: string | null | undefined) => useLoaded(uid, loadOrders);
export const useMembership = (uid: string | null | undefined) => useLoaded(uid, loadMembership);

// ---------- deleting the account ----------
/**
 * As on the website: the edge function deletes the member's photos and files, then their login, which takes the
 * profile, visits, reviews, questions, answers and likes with it (schema.sql cascades). Then this phone forgets
 * them: the saved visits, outbox, orders and membership (AsyncStorage keys ab.*.<uid>) and the photos waiting in
 * the outbox folder.
 */
export async function deleteAccount(uid: string) {
  if (!(await isOnline())) { const e: any = new Error("Deleting your account needs a connection. Try again when you have signal."); e.network = true; throw e; }
  await accountFn("delete");
  await sb.auth.signOut({ scope: "local" }).catch(() => {});        // the login no longer exists on the server
  await clearLocal(uid);
  setTimeout(() => { clearLocal(uid).catch(() => {}); }, 3000);     // in case a sync that was under way wrote once more
}

/** Removes everything this phone keeps for one member. */
export async function clearLocal(uid: string) {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("ab.") && k.endsWith(`.${uid}`));
  const othersOutbox = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("ab.outbox.") && !k.endsWith(`.${uid}`));
  if (Platform.OS !== "web") {
    // keep only the files another account on this phone is still waiting to upload; delete the rest
    const keep = new Set<string>();
    for (const k of othersOutbox) {
      try { for (const op of JSON.parse((await AsyncStorage.getItem(k)) || "[]")) for (const u of [op.full, op.thumb, ...(op.local || [])]) if (u) keep.add(name(u)); } catch {}
    }
    try {
      const d = new Directory(Paths.document, "outbox");
      if (d.exists) for (const f of d.list()) if (f instanceof File && !keep.has(name(f.uri))) { try { f.delete(); } catch {} }
    } catch {}
  }
  if (keys.length) await AsyncStorage.multiRemove(keys);
}
const name = (uri: string) => uri.split("/").pop() || uri;
