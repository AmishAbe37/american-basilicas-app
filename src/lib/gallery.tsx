import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useState } from "react";
import { BUCKET, must, sb } from "./supabase";

// The members' gallery: approved photos, reviews, and questions and answers, basilica by basilica.
// Every call mirrors the website's members/core.js; what each member may read or write is decided by the
// database rules in supabase/schema.sql (gallery access = free 3 months after sign-up, then a membership).

export type Kind = "trial" | "subscriber" | "admin" | "expired";
export type Membership = {
  access: boolean; kind: Kind; joined?: string | null; free_until?: string | null; paid_through?: string | null;
  email?: string | null; welcomed_at?: string | null;
};
export type Counts = { photos: number; reviews: number; questions: number };
export type Status = "pending" | "approved" | "rejected";
type By = { profiles?: { display_name: string | null } | null };
export type GPhoto = By & {
  id: string; user_id: string; basilica_id: string; storage_path: string; thumb_path: string; caption: string | null;
  width: number | null; height: number | null; status: Status; like_count: number; created_at: string;
};
export type GReview = By & {
  id: string; user_id: string; basilica_id: string; body: string; status: Status; like_count: number;
  created_at: string; updated_at: string;
};
export type GQuestion = By & {
  id: string; user_id: string; basilica_id: string; body: string; status: Status; answer_count: number;
  author_visited: boolean; created_at: string; updated_at: string;
};
export type GAnswer = By & {
  id: string; question_id: string; user_id: string; body: string; status: Status; author_visited: boolean;
  created_at: string; updated_at: string;
};
export type Tab = "photos" | "reviews" | "questions";
export type Sort = "popular" | "latest";
export type LikeKind = "photo" | "review";

export const TABS: Record<Tab, string> = { photos: "Photos", reviews: "Reviews", questions: "Questions" };
export const SORTS: Record<Tab, [string, string]> = {
  photos: ["Most liked", "Latest"], reviews: ["Most liked", "Latest"], questions: ["Most answered", "Latest"],
};
export const PAGE: Record<Tab, number> = { photos: 24, reviews: 10, questions: 10 };

// ---------- wording shared with the website (members/bview.js, members/shell.js) ----------
const plural = (n: number, w: string) => `${(n || 0).toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
export const countLine = (c: Partial<Counts>) =>
  `${plural(c.photos || 0, "photo")} · ${plural(c.reviews || 0, "review")} · ${plural(c.questions || 0, "question")}`;
export const countTotal = (c?: Partial<Counts>) => (c?.photos || 0) + (c?.reviews || 0) + (c?.questions || 0);
export const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const t = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
  return t.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
export const daysLeft = (ts?: string | null) => Math.max(0, Math.ceil((new Date(ts || 0).getTime() - Date.now()) / 86400000));
export const who = (x: By) => x.profiles?.display_name || "A member";
export const when = (x: { created_at: string; updated_at?: string }) =>
  fmtDate(x.created_at) + (x.updated_at && new Date(x.updated_at).getTime() - new Date(x.created_at).getTime() > 60000 ? " · edited" : "");

/** Where the member stands, in the website's words. Parts marked b are bold.
 *  The app never links to a purchase (Abraham's decision): the "expired" line drops the site's "Subscribe to…"
 *  call to action, and the screens add a neutral line saying memberships are managed on americanbasilicas.org. */
export type Line = { tag: string; parts: { t: string; b?: boolean }[] };
export function memberLine(m: Membership): Line {
  if (m.kind === "admin") return { tag: "Administrator", parts: [{ t: "You have full access to the members’ gallery as a site administrator." }] };
  if (m.kind === "subscriber") return { tag: "Subscriber", parts: [
    { t: "Thank you for subscribing. Your gallery access runs through " }, { t: fmtDate(m.paid_through), b: true }, { t: " and renews with your membership." }] };
  if (m.kind === "trial") {
    const d = daysLeft(m.free_until);
    return { tag: `Free for ${d} more day${d === 1 ? "" : "s"}`, parts: [
      { t: "The members’ gallery is included free until " }, { t: fmtDate(m.free_until), b: true },
      { t: " — your first three months. After that, it’s for subscribers. Your own map, visits and photos stay free." }] };
  }
  return { tag: "Subscribers only", parts: [
    { t: "Your free three months of the members’ gallery ended on " }, { t: fmtDate(m.free_until), b: true },
    { t: ". Members’ photos, reviews and questions are for subscribers. Your own map, visits and photos stay free." }] };
}
export const MANAGED_ON_SITE = "Memberships are managed on americanbasilicas.org.";

// ---------- connection ----------
export const transient = (e: any) => /network|fetch|timed? ?out|offline|connection|abort|load failed/i.test(String(e?.message || e));
export const OFFLINE_WRITE = "You’re offline. This needs a connection — please try again when you have signal.";
export function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOn(s.isConnected !== false && s.isInternetReachable !== false)), []);
  return on;
}
export async function isOnline() {
  const s = await NetInfo.fetch();
  return s.isConnected !== false && s.isInternetReachable !== false;
}

// ---------- cache: the last-loaded gallery data, per member, so it still shows with no signal ----------
export type Cached<T> = { at: string; data: T };
const ck = (uid: string, key: string) => `ab.gallery.${uid}.${key}`;
export async function readCache<T>(uid: string, key: string): Promise<Cached<T> | null> {
  try { const s = await AsyncStorage.getItem(ck(uid, key)); return s ? (JSON.parse(s) as Cached<T>) : null; } catch { return null; }
}
export async function writeCache<T>(uid: string, key: string, data: T) {
  try { await AsyncStorage.setItem(ck(uid, key), JSON.stringify({ at: new Date().toISOString(), data })); } catch {}
}

// ---------- the calls ----------
export type Source = {
  uid: string;
  membership: () => Promise<Membership>;
  counts: () => Promise<Record<string, Counts>>;
  photosFor: (bid: string, o: { sort: Sort; offset: number; limit: number }) => Promise<GPhoto[]>;
  reviewsFor: (bid: string, o: { sort: Sort; offset: number; limit: number }) => Promise<GReview[]>;
  questionsFor: (bid: string, o: { sort: Sort; offset: number; limit: number }) => Promise<GQuestion[]>;
  answersFor: (qids: string[]) => Promise<GAnswer[]>;
  urls: (paths: string[]) => Promise<Record<string, string>>;
  myLikes: (kind: LikeKind, ids: string[]) => Promise<Set<string>>;
  like: (kind: LikeKind, id: string) => Promise<void>;
  unlike: (kind: LikeKind, id: string) => Promise<void>;
  myReview: (bid: string) => Promise<GReview | null>;
  saveReview: (bid: string, body: string, id?: string) => Promise<GReview>;
  deleteReview: (id: string) => Promise<void>;
  ask: (bid: string, body: string) => Promise<GQuestion>;
  answer: (qid: string, body: string) => Promise<GAnswer>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteAnswer: (id: string) => Promise<void>;
};

const PHOTO_COLS = "id,user_id,basilica_id,storage_path,thumb_path,caption,width,height,status,like_count,created_at";
const PHOTO_BY = ",profiles!photos_user_id_fkey(display_name)", REVIEW_BY = ",profiles!reviews_user_id_fkey(display_name)";
const REVIEW_COLS = "id,user_id,basilica_id,body,status,like_count,created_at,updated_at";
const Q_COLS = "id,user_id,basilica_id,body,status,answer_count,author_visited,created_at,updated_at";
const A_COLS = "id,question_id,user_id,body,status,author_visited,created_at,updated_at";
const Q_BY = ",profiles!questions_user_id_fkey(display_name)", A_BY = ",profiles!answers_user_id_fkey(display_name)";
const LIKES: Record<LikeKind, [string, string]> = { photo: ["photo_likes", "photo_id"], review: ["review_likes", "review_id"] };

const sorted = (q: any, sort: Sort) => sort === "latest"
  ? q.order("created_at", { ascending: false }).order("id")
  : q.order("like_count", { ascending: false }).order("created_at", { ascending: false }).order("id");
const qaError = (e: any, what: string) => {
  const m = String(e?.message || "");
  if (/a day/.test(m)) return e;
  if (/row-level security|violates|permission/.test(m)) return new Error(`Only members with gallery access can ${what}.`);
  return e;
};

export function liveSource(uid: string): Source {
  return {
    uid,
    membership: async () => {
      const rows = must(await sb.rpc("membership")) as Membership[] | null;
      return (rows && rows[0]) || { access: false, kind: "expired" };
    },
    // gallery_counts with question_counts folded in, as AB.allCounts does
    counts: async () => {
      const [g, q] = await Promise.all([
        sb.rpc("gallery_counts").then(must) as Promise<{ basilica_id: string; photos: number; reviews: number }[]>,
        (sb.rpc("question_counts").then(must) as Promise<{ basilica_id: string; questions: number }[]>).catch(() => []),
      ]);
      const m: Record<string, Counts> = {};
      g.forEach((r) => (m[r.basilica_id] = { photos: Number(r.photos) || 0, reviews: Number(r.reviews) || 0, questions: 0 }));
      q.forEach((r) => { (m[r.basilica_id] ||= { photos: 0, reviews: 0, questions: 0 }).questions = Number(r.questions) || 0; });
      return m;
    },
    photosFor: async (bid, { sort, offset, limit }) => must(await sorted(sb.from("photos").select(PHOTO_COLS + PHOTO_BY)
      .eq("status", "approved").eq("basilica_id", bid), sort).range(offset, offset + limit - 1)) as GPhoto[],
    reviewsFor: async (bid, { sort, offset, limit }) => must(await sorted(sb.from("reviews").select(REVIEW_COLS + REVIEW_BY)
      .eq("status", "approved").eq("basilica_id", bid), sort).range(offset, offset + limit - 1)) as GReview[],
    // approved questions plus the member's own (theirs show "Waiting for approval" until checked)
    questionsFor: async (bid, { sort, offset, limit }) => {
      let q: any = sb.from("questions").select(Q_COLS + Q_BY).eq("basilica_id", bid).or(`status.eq.approved,user_id.eq.${uid}`);
      q = sort === "popular" ? q.order("answer_count", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
      return must(await q.order("id").range(offset, offset + limit - 1)) as GQuestion[];
    },
    answersFor: async (qids) => {
      const out: GAnswer[] = [];
      for (let i = 0; i < qids.length; i += 50)
        out.push(...(must(await sb.from("answers").select(A_COLS + A_BY).in("question_id", qids.slice(i, i + 50))
          .or(`status.eq.approved,user_id.eq.${uid}`).order("created_at").order("id")) as unknown as GAnswer[]));
      return out;
    },
    urls: async (paths) => {                 // private files -> short-lived links (as AB.urls)
      const out: Record<string, string> = {}, list = [...new Set(paths.filter(Boolean))];
      for (let i = 0; i < list.length; i += 100) {
        const rows = must(await sb.storage.from(BUCKET).createSignedUrls(list.slice(i, i + 100), 3600)) as any[];
        rows.forEach((r) => { if (r.signedUrl && r.path) out[r.path] = r.signedUrl; });
      }
      return out;
    },
    myLikes: async (kind, ids) => {
      const [t, col] = LIKES[kind], out = new Set<string>();
      for (let i = 0; i < ids.length; i += 100)
        (must(await sb.from(t).select(col).eq("user_id", uid).in(col, ids.slice(i, i + 100))) as any[]).forEach((r) => out.add(r[col]));
      return out;
    },
    like: async (kind, id) => { const [t, col] = LIKES[kind]; must(await sb.from(t).insert({ [col]: id } as any)); },
    unlike: async (kind, id) => { const [t, col] = LIKES[kind]; must(await sb.from(t).delete().eq("user_id", uid).eq(col, id)); },
    myReview: async (bid) => must(await sb.from("reviews").select(REVIEW_COLS).eq("user_id", uid).eq("basilica_id", bid).maybeSingle()) as GReview | null,
    // one review per member per basilica; the database only accepts it after a visit with at least one photo
    saveReview: async (bid, body, id) => {
      body = String(body || "").trim();
      if (body.length < 20) throw new Error("Write at least 20 characters.");
      if (body.length > 2000) throw new Error("Keep it under 2,000 characters.");
      const q = id ? sb.from("reviews").update({ body }).eq("id", id) : sb.from("reviews").insert({ basilica_id: bid, body });
      try { return must(await q.select(REVIEW_COLS).single()) as GReview; }
      catch (e: any) {
        throw /row-level security|violates/.test(String(e?.message)) ? new Error("Add at least one photo from your visit first, then you can leave a review.") : e;
      }
    },
    deleteReview: async (id) => { must(await sb.from("reviews").delete().eq("id", id)); },
    ask: async (bid, body) => {
      body = String(body || "").trim();
      if (body.length < 10) throw new Error("Write at least 10 characters.");
      if (body.length > 500) throw new Error("Keep questions under 500 characters.");
      try { return must(await sb.from("questions").insert({ basilica_id: bid, body }).select(Q_COLS).single()) as GQuestion; }
      catch (e) { throw qaError(e, "ask questions"); }
    },
    answer: async (qid, body) => {
      body = String(body || "").trim();
      if (body.length < 2) throw new Error("Write an answer first.");
      if (body.length > 1500) throw new Error("Keep answers under 1,500 characters.");
      try { return must(await sb.from("answers").insert({ question_id: qid, body }).select(A_COLS).single()) as GAnswer; }
      catch (e) { throw qaError(e, "answer questions"); }
    },
    deleteQuestion: async (id) => { must(await sb.from("questions").delete().eq("id", id)); },
    deleteAnswer: async (id) => { must(await sb.from("answers").delete().eq("id", id)); },
  };
}

/** The gallery's data source. Live by default; the dev-only preview screen swaps in sample data. */
export const GallerySourceContext = createContext<((uid: string) => Source) | null>(null);
export function useGallerySource(uid: string | null | undefined): Source | null {
  const make = useContext(GallerySourceContext) || liveSource;
  const [src, setSrc] = useState<Source | null>(null);
  useEffect(() => { setSrc(uid ? make(uid) : null); }, [uid, make]);
  return src;
}

/** "Not now" on the review prompt: don't ask again for that basilica while the app is open (as the site does per page). */
export const reviewLater = new Set<string>();

/** Membership and counts for the signed-in member, from the network or, with no signal, from the last time. */
export function useGalleryBasics(src: Source | null) {
  const [M, setM] = useState<Membership | null>(null);
  const [counts, setCounts] = useState<Record<string, Counts> | null>(null);
  const [offlineSince, setOfflineSince] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!src) { setM(null); setCounts(null); return; }
    let live = true;
    (async () => {
      const [cm, cc] = await Promise.all([readCache<Membership>(src.uid, "membership"), readCache<Record<string, Counts>>(src.uid, "counts")]);
      if (live && cm && cc) { setM((x) => x || cm.data); setCounts((x) => x || cc.data); }
      try {
        const [m, c] = await Promise.all([src.membership(), src.counts()]);
        if (!live) return;
        setM(m); setCounts(c); setOfflineSince(null); setError(null);
        writeCache(src.uid, "membership", m); writeCache(src.uid, "counts", c);
      } catch (e: any) {
        if (!live) return;
        if (cm && cc) setOfflineSince(cm.at);
        else setError(transient(e) ? "You’re offline. The members’ gallery needs a connection the first time you open it." : `Couldn’t open the gallery: ${e?.message || e}`);
      }
    })();
    return () => { live = false; };
  }, [src, tick]);
  const recheck = async () => {
    if (!src) return null;
    const m = await src.membership();
    setM(m); writeCache(src.uid, "membership", m);
    return m;
  };
  return { M, counts, offlineSince, error, reload: () => setTick((t) => t + 1), recheck };
}
