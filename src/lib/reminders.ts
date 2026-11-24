import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import { router } from "expo-router";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Linking, Platform } from "react-native";
import { byId } from "../data/basilicas";
import { useVisits } from "./visits";

// Reminders on this phone only: local notifications, scheduled by the app itself. Nothing is sent to a server,
// nothing is stored in the website's database, and there is no push service (so no cost and no account).
//   - Plan a visit: "Your visit to <basilica> is today", at the date and time the pilgrim picks.
//   - Photos waiting: about a day after photos start waiting in the offline outbox (visits.tsx), a gentle nudge to
//     open the app on Wi-Fi. Cancelled as soon as the outbox empties.
//   - Visit anniversaries (off unless turned on): "A year ago today you visited <basilica>".
// Permission is asked only when the pilgrim first sets a reminder, never at launch.
// Local notifications work in Expo Go on Android and iOS (only *push* left Expo Go on Android in SDK 53).
// expo-notifications has no web version, so on the web preview plans are saved but nothing is scheduled.

export type Plan = { id: string; bid: string; at: string };          // at: ISO date-time of the reminder
export type Settings = { photos: boolean; anniversary: boolean };
export type Permission = "granted" | "denied" | "undetermined";

const NATIVE = Platform.OS !== "web";
const K_PLANS = "ab.reminders.plans", K_SETTINGS = "ab.reminders.settings";
const CHANNEL = "reminders";
const OUTBOX_ID = "outbox-photos";
const OUTBOX_DELAY_S = 24 * 60 * 60;            // "about a day later"
const ANNIV_MAX = 24;                            // iOS keeps at most 64 pending local notifications per app
const ANNIV_HOUR = 9;                            // anniversaries arrive at 9 in the morning
const DEFAULTS: Settings = { photos: true, anniversary: false };

const planKey = (id: string) => `plan-${id}`;
const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

type State = {
  ready: boolean;
  plans: Plan[];                                 // upcoming, soonest first
  settings: Settings;
  permission: Permission;
  /** Asks for permission if needed. Returns false if the pilgrim said no (or said no before). */
  ensurePermission: () => Promise<boolean>;
  addPlan: (bid: string, at: Date) => Promise<"ok" | "denied" | "past">;
  cancelPlan: (id: string) => Promise<void>;
  setSetting: (k: keyof Settings, on: boolean) => Promise<"ok" | "denied">;
  openSettings: () => void;
};
const Ctx = createContext<State | null>(null);
export const useReminders = () => useContext(Ctx)!;

// Show reminders even when the app is open.
if (NATIVE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

async function channel() {
  // Android 8+ files every notification under a channel, and Android 13+ won't show the permission prompt until one exists.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Reminders", description: "Planned visits, photos waiting to upload and visit anniversaries",
      importance: AndroidImportance.DEFAULT,
    });
  }
}

async function schedule(identifier: string, title: string, body: string, data: Record<string, string>, trigger: Notifications.NotificationTriggerInput) {
  if (!NATIVE) return;
  await Notifications.scheduleNotificationAsync({ identifier, content: { title, body, data, sound: false }, trigger });
}
async function cancel(identifier: string) {
  if (!NATIVE) return;
  try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch {}
}
const dateTrigger = (d: Date): Notifications.DateTriggerInput =>
  ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: CHANNEL });

/** The next anniversaries of the member's visits (one notification per day, naming every basilica visited on it). */
export function upcomingAnniversaries(visits: { basilica_id: string; visited_on: string | null }[], now = new Date(), max = ANNIV_MAX) {
  const byDay = new Map<string, { when: Date; years: number; names: string[]; bids: string[] }>();
  for (const v of visits) {
    const b = byId(v.basilica_id);
    if (!b || !v.visited_on) continue;
    const [y, m, d] = v.visited_on.split("-").map(Number);
    if (!y || !m || !d) continue;
    for (let yr = Math.max(y + 1, now.getFullYear()); yr <= now.getFullYear() + 1; yr++) {
      const last = new Date(yr, m, 0).getDate();                      // Feb 29 visits are remembered on Feb 28
      const when = new Date(yr, m - 1, Math.min(d, last), ANNIV_HOUR, 0, 0);
      if (when <= now) continue;
      const key = `${when.toDateString()}|${yr - y}`;
      const e = byDay.get(key) || { when, years: yr - y, names: [], bids: [] };
      e.names.push(b.name); e.bids.push(b.id); byDay.set(key, e);
      break;
    }
  }
  return [...byDay.values()].sort((a, b) => +a.when - +b.when).slice(0, max).map((e) => ({
    id: `anniv-${e.when.getFullYear()}-${e.when.getMonth() + 1}-${e.when.getDate()}-${e.years}`,
    when: e.when,
    body: `${e.years === 1 ? "A year" : `${e.years} years`} ago today you visited ${list(e.names)}.`,
    bid: e.bids.length === 1 ? e.bids[0] : "",
  }));
}
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const V = useVisits();
  const [ready, setReady] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [permission, setPermission] = useState<Permission>(NATIVE ? "undetermined" : "granted");
  const annivIds = useRef<string[]>([]);

  const readPermission = useCallback(async () => {
    if (!NATIVE) return "granted" as Permission;
    const p = await Notifications.getPermissionsAsync();
    const s: Permission = p.granted || p.ios?.status === IosAuthorizationStatus.PROVISIONAL ? "granted" : p.canAskAgain ? "undetermined" : "denied";
    setPermission(s);
    return s;
  }, []);

  // Load what's saved on the phone. Looking up the permission doesn't ask for it.
  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([AsyncStorage.getItem(K_PLANS), AsyncStorage.getItem(K_SETTINGS)]);
      const all: Plan[] = p ? JSON.parse(p) : [];
      const upcoming = all.filter((x) => !isPast(x.at));                  // a plan's day has come: it's done
      if (upcoming.length !== all.length) AsyncStorage.setItem(K_PLANS, JSON.stringify(upcoming));
      setPlans(upcoming);
      if (s) setSettings({ ...DEFAULTS, ...JSON.parse(s) });
      await readPermission();
      setReady(true);
    })().catch(() => setReady(true));
  }, [readPermission]);

  // The pilgrim may change the permission in Settings and come back.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") readPermission(); });
    return () => sub.remove();
  }, [readPermission]);

  // Tapping a reminder opens the basilica (or My pilgrimage, for photos waiting).
  useEffect(() => {
    if (!NATIVE) return;
    const go = (r: Notifications.NotificationResponse | null) => {
      const d = r?.notification.request.content.data as { bid?: string; kind?: string } | undefined;
      if (d?.bid && byId(d.bid)) router.push({ pathname: "/basilica/[id]", params: { id: d.bid } });
      else if (d?.kind === "outbox") router.push("/mine");
    };
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) { go(r); Notifications.clearLastNotificationResponseAsync?.(); } }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, []);

  const ensurePermission = useCallback(async () => {
    if (!NATIVE) return true;
    const now = await readPermission();
    if (now === "granted") { await channel(); return true; }
    if (now === "denied") return false;
    await channel();
    const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    const granted = r.granted || r.ios?.status === IosAuthorizationStatus.PROVISIONAL;
    setPermission(granted ? "granted" : r.canAskAgain ? "undetermined" : "denied");
    return !!granted;
  }, [readPermission]);

  const savePlans = (next: Plan[]) => {
    const sorted = next.slice().sort((a, b) => a.at.localeCompare(b.at));
    setPlans(sorted); AsyncStorage.setItem(K_PLANS, JSON.stringify(sorted));
  };

  const addPlan = useCallback(async (bid: string, at: Date) => {
    const b = byId(bid);
    if (!b) return "past" as const;
    if (at.getTime() < Date.now() + 60_000) return "past" as const;
    if (!(await ensurePermission())) return "denied" as const;
    const id = `${bid}-${at.getTime()}`;
    await schedule(planKey(id), "Your visit is today", `Your visit to ${b.name} is today.`, { kind: "plan", bid }, dateTrigger(at));
    savePlans([...plans.filter((p) => p.id !== id), { id, bid, at: at.toISOString() }]);
    return "ok" as const;
  }, [plans, ensurePermission]);

  const cancelPlan = useCallback(async (id: string) => {
    await cancel(planKey(id));
    savePlans(plans.filter((p) => p.id !== id));
  }, [plans]);

  const setSetting = useCallback(async (k: keyof Settings, on: boolean) => {
    if (on && !(await ensurePermission())) return "denied" as const;
    const next = { ...settings, [k]: on };
    setSettings(next); AsyncStorage.setItem(K_SETTINGS, JSON.stringify(next));
    return "ok" as const;
  }, [settings, ensurePermission]);

  // ---- photos waiting in the outbox ----
  const waiting = V.photos.filter((p) => p.status === "waiting").length;
  useEffect(() => {
    if (!ready || !NATIVE) return;
    (async () => {
      if (!waiting || !settings.photos || permission !== "granted") { await cancel(OUTBOX_ID); return; }
      // keep the first nudge: adding another photo shouldn't push it back a day
      const pending = await Notifications.getAllScheduledNotificationsAsync();
      if (pending.some((n) => n.identifier === OUTBOX_ID)) return;
      await schedule(OUTBOX_ID, "Photos waiting to upload",
        "Some of your basilica photos are still on this phone. Open American Basilicas on Wi-Fi and they’ll upload.",
        { kind: "outbox" },
        { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: OUTBOX_DELAY_S, repeats: false, channelId: CHANNEL });
    })().catch(() => {});
  }, [ready, waiting, settings.photos, permission]);

  // ---- visit anniversaries ----
  const visitKey = useMemo(() => [...V.visits.values()].map((v) => `${v.basilica_id}:${v.visited_on}`).sort().join(","), [V.visits]);
  useEffect(() => {
    if (!ready || !NATIVE) return;
    const t = setTimeout(async () => {
      const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      const old = new Set([...annivIds.current, ...pending.map((n) => n.identifier).filter((id) => id.startsWith("anniv-"))]);
      const want = settings.anniversary && permission === "granted" ? upcomingAnniversaries([...V.visits.values()]) : [];
      const keep = new Set(want.map((a) => a.id));
      for (const id of old) if (!keep.has(id)) await cancel(id);
      for (const a of want) {
        if (old.has(a.id)) continue;
        await schedule(a.id, "On this day", a.body, a.bid ? { kind: "anniversary", bid: a.bid } : { kind: "anniversary" }, dateTrigger(a.when)).catch(() => {});
      }
      annivIds.current = [...keep];
    }, 800);                                    // wait for a burst of visit changes to settle
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, visitKey, settings.anniversary, permission]);

  // ---- planned visits: put back any reminder the system lost (e.g. after the permission was turned back on) ----
  useEffect(() => {
    if (!ready || !NATIVE || permission !== "granted" || !plans.length) return;
    (async () => {
      const have = new Set((await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier));
      for (const p of plans) {
        const b = byId(p.bid);
        if (!b || isPast(p.at) || have.has(planKey(p.id))) continue;
        await channel();
        await schedule(planKey(p.id), "Your visit is today", `Your visit to ${b.name} is today.`, { kind: "plan", bid: p.bid }, dateTrigger(new Date(p.at)));
      }
    })().catch(() => {});
  }, [ready, permission, plans]);

  const value: State = {
    ready, plans, settings, permission, ensurePermission, addPlan, cancelPlan, setSetting,
    openSettings: () => { Linking.openSettings().catch(() => {}); },
  };
  return createElement(Ctx.Provider, { value }, children);
}
