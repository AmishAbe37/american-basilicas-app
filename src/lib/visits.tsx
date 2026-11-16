import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "./auth";
import { BUCKET, must, sb } from "./supabase";

// Visits and visit photos, kept on the phone first and sent to the website's database when there is signal,
// so checking off a basilica works inside a stone church with no reception. The calls mirror members/core.js.

export type Visit = { basilica_id: string; visited_on: string | null; note: string | null };
export type Photo = {
  id: string; basilica_id: string; storage_path: string; thumb_path: string; caption: string | null;
  width: number; height: number; status: string; created_at: string;
  local?: string;                 // a file on this phone, while it waits to upload
};
type Op =
  | { t: "visit"; bid: string; fields: Partial<Pick<Visit, "visited_on" | "note">> }
  | { t: "unvisit"; bid: string }
  | { t: "photo"; bid: string; id: string; full: string; thumb: string; w: number; h: number }
  | { t: "delphoto"; id: string; storage_path: string; thumb_path: string; local?: string[] };

const FULL_PX = 2000, THUMB_PX = 480;    // the website's sizes
const PHOTO_COLS = "id,user_id,basilica_id,storage_path,thumb_path,caption,width,height,status,created_at";
export const today = () => { const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); };

type State = {
  visits: Map<string, Visit>;
  photos: Photo[];                // the member's photos, uploaded and waiting
  pending: number;                // changes saved on the phone, not yet sent
  online: boolean;
  syncing: boolean;
  lastError: string | null;
  checkIn: (bid: string) => void;
  update: (bid: string, fields: Partial<Pick<Visit, "visited_on" | "note">>) => void;
  remove: (bid: string) => void;
  addPhotos: (bid: string, assets: { uri: string; width: number; height: number }[]) => Promise<number>;
  deletePhoto: (p: Photo) => void;
  thumbUrl: (p: Photo) => string | undefined;
  sync: () => void;
};
export const VisitsContext = createContext<State | null>(null);
const Ctx = VisitsContext;
export const useVisits = () => useContext(Ctx)!;

const transient = (e: any) => /network|fetch|timed? ?out|offline|connection|abort/i.test(String(e?.message || e));
const dir = () => { const d = new Directory(Paths.document, "outbox"); if (!d.exists) d.create(); return d; };

export function VisitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [visits, setVisits] = useState<Map<string, Visit>>(new Map());
  const [server, setServer] = useState<Photo[]>([]);
  const [ops, setOps] = useState<Op[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const opsRef = useRef<Op[]>([]); opsRef.current = ops;
  const busy = useRef(false);
  const K = (s: string) => `ab.${s}.${uid}`;

  // load what's on the phone for this member
  useEffect(() => {
    if (!uid) { setVisits(new Map()); setServer([]); setOps([]); return; }
    (async () => {
      const [v, p, o] = await Promise.all([AsyncStorage.getItem(K("visits")), AsyncStorage.getItem(K("photos")), AsyncStorage.getItem(K("outbox"))]);
      if (v) setVisits(new Map(JSON.parse(v)));
      if (p) setServer(JSON.parse(p));
      if (o) setOps(JSON.parse(o));
      sync();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const saveOps = (next: Op[]) => { setOps(next); opsRef.current = next; if (uid) AsyncStorage.setItem(K("outbox"), JSON.stringify(next)); };
  const saveVisits = (m: Map<string, Visit>) => { setVisits(m); if (uid) AsyncStorage.setItem(K("visits"), JSON.stringify([...m])); };
  const saveServer = (p: Photo[]) => { setServer(p); if (uid) AsyncStorage.setItem(K("photos"), JSON.stringify(p)); };
  const queue = (op: Op) => { saveOps([...opsRef.current, op]); setTimeout(() => sync(), 0); };

  async function run(op: Op) {
    if (!uid) return;
    switch (op.t) {
      case "visit":
        must(await sb.from("visits").upsert({ basilica_id: op.bid, ...op.fields }, { onConflict: "user_id,basilica_id" }));
        return;
      case "unvisit": {        // as on the website: remove the visit's photos and files, then the visit
        const ps = must(await sb.from("photos").select("storage_path,thumb_path").eq("user_id", uid).eq("basilica_id", op.bid)) as any[];
        if (ps.length) must(await sb.storage.from(BUCKET).remove(ps.flatMap((p) => [p.storage_path, p.thumb_path])));
        must(await sb.from("visits").delete().eq("user_id", uid).eq("basilica_id", op.bid));
        return;
      }
      case "photo": {
        const path = `${uid}/${op.bid}/${op.id}.jpg`, tpath = path.replace(/\.jpg$/, ".t.jpg");
        const st = sb.storage.from(BUCKET), opt = { contentType: "image/jpeg", upsert: false, cacheControl: "31536000" };
        const up = async (p: string, uri: string) => {
          const r = await st.upload(p, await new File(uri).bytes(), opt);
          if (r.error && !/exists|duplicate/i.test(r.error.message)) throw r.error;    // a retry after a lost reply
        };
        await up(path, op.full); await up(tpath, op.thumb);
        const r = await sb.from("photos").insert({ basilica_id: op.bid, storage_path: path, width: op.w, height: op.h });
        if (r.error && !/duplicate/i.test(r.error.message)) { await st.remove([path, tpath]); throw r.error; }
        for (const u of [op.full, op.thumb]) { try { new File(u).delete(); } catch {} }
        return;
      }
      case "delphoto":
        if (op.storage_path) {
          must(await sb.storage.from(BUCKET).remove([op.storage_path, op.thumb_path]));
          must(await sb.from("photos").delete().eq("id", op.id));
        }
        for (const u of op.local || []) { try { new File(u).delete(); } catch {} }
        return;
    }
  }

  const refresh = useCallback(async () => {
    if (!uid) return;
    const vs = must(await sb.from("visits").select("basilica_id,visited_on,note")) as Visit[];
    const ps = must(await sb.from("photos").select(PHOTO_COLS).eq("user_id", uid).order("created_at")) as Photo[];
    // keep local edits that haven't gone up yet on top of what the server says
    const m = new Map(vs.map((v) => [v.basilica_id, v]));
    for (const op of opsRef.current) {
      if (op.t === "visit") m.set(op.bid, { ...(m.get(op.bid) || { basilica_id: op.bid, visited_on: null, note: null }), ...op.fields });
      if (op.t === "unvisit") m.delete(op.bid);
    }
    saveVisits(m); saveServer(ps);
    const paths = ps.map((p) => p.thumb_path).filter(Boolean);
    if (paths.length) {
      const out: Record<string, string> = {};
      for (let i = 0; i < paths.length; i += 100) {
        const rows = must(await sb.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 100), 3600)) as any[];
        rows.forEach((r) => { if (r.signedUrl) out[r.path] = r.signedUrl; });
      }
      setUrls(out);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const sync = useCallback(async () => {
    if (!uid || busy.current) return;
    const net = await NetInfo.fetch();
    const isOn = net.isConnected !== false && net.isInternetReachable !== false;
    setOnline(isOn);
    if (!isOn) return;
    busy.current = true; setSyncing(true);
    try {
      while (opsRef.current.length) {
        const op = opsRef.current[0];
        try { await run(op); }
        catch (e: any) {
          if (transient(e)) throw e;                                    // try again when there's signal
          setLastError(e?.message || String(e));                         // the server said no: drop this change
        }
        saveOps(opsRef.current.slice(1));
      }
      await refresh();
    } catch (e: any) {
      if (transient(e)) setOnline(false); else setLastError(e?.message || String(e));
    } finally { busy.current = false; setSyncing(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, refresh]);

  // send waiting changes when signal comes back or the app returns to the front
  useEffect(() => {
    const a = NetInfo.addEventListener((s) => { const on = s.isConnected !== false && s.isInternetReachable !== false; setOnline(on); if (on) sync(); });
    const b = AppState.addEventListener("change", (s) => { if (s === "active") sync(); });
    return () => { a(); b.remove(); };
  }, [sync]);

  const checkIn = useCallback((bid: string) => {
    const m = new Map(visits); m.set(bid, { basilica_id: bid, visited_on: today(), note: null }); saveVisits(m);
    queue({ t: "visit", bid, fields: { visited_on: today() } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, uid]);
  const update = useCallback((bid: string, fields: Partial<Pick<Visit, "visited_on" | "note">>) => {
    const m = new Map(visits); m.set(bid, { ...(m.get(bid) || { basilica_id: bid, visited_on: null, note: null }), ...fields }); saveVisits(m);
    queue({ t: "visit", bid, fields });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, uid]);
  const remove = useCallback((bid: string) => {
    const m = new Map(visits); m.delete(bid); saveVisits(m);
    const dropped = opsRef.current.filter((o) => o.t === "photo" && o.bid === bid) as Extract<Op, { t: "photo" }>[];
    saveOps(opsRef.current.filter((o) => !((o.t === "photo" || o.t === "visit") && o.bid === bid)));
    dropped.forEach((o) => { for (const u of [o.full, o.thumb]) { try { new File(u).delete(); } catch {} } });
    saveServer(server.filter((p) => p.basilica_id !== bid));
    queue({ t: "unvisit", bid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, server, uid]);

  /** Resize and re-encode each photo as on the website (2000 px and a 480 px copy). Re-encoding writes a new JPEG
   *  without the original's metadata, so the location the phone recorded is not uploaded. */
  const addPhotos = useCallback(async (bid: string, assets: { uri: string; width: number; height: number }[]) => {
    if (!visits.has(bid)) { const m = new Map(visits); m.set(bid, { basilica_id: bid, visited_on: today(), note: null }); saveVisits(m); queue({ t: "visit", bid, fields: { visited_on: today() } }); }
    let n = 0;
    for (const a of assets) {
      const fit = (max: number) => (a.width >= a.height ? { width: Math.min(max, a.width) } : { height: Math.min(max, a.height) });
      const full = await manipulateAsync(a.uri, [{ resize: fit(FULL_PX) }], { compress: 0.86, format: SaveFormat.JPEG });
      const thumb = await manipulateAsync(a.uri, [{ resize: fit(THUMB_PX) }], { compress: 0.8, format: SaveFormat.JPEG });
      const id = Crypto.randomUUID();
      let fullUri = full.uri, thumbUri = thumb.uri;
      if (Platform.OS !== "web") {                 // keep them somewhere the system won't clear before they upload
        const d = dir(), f = new File(d, `${id}.jpg`), t = new File(d, `${id}.t.jpg`);
        new File(full.uri).copy(f); new File(thumb.uri).copy(t); fullUri = f.uri; thumbUri = t.uri;
      }
      queue({ t: "photo", bid, id, full: fullUri, thumb: thumbUri, w: full.width, h: full.height });
      n++;
    }
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, uid]);

  const deletePhoto = useCallback((p: Photo) => {
    if (p.local) {                                   // not uploaded yet: just drop it from the outbox
      const op = opsRef.current.find((o) => o.t === "photo" && o.id === p.id) as Extract<Op, { t: "photo" }> | undefined;
      saveOps(opsRef.current.filter((o) => !(o.t === "photo" && o.id === p.id)));
      if (op) for (const u of [op.full, op.thumb]) { try { new File(u).delete(); } catch {} }
      return;
    }
    saveServer(server.filter((x) => x.id !== p.id));
    queue({ t: "delphoto", id: p.id, storage_path: p.storage_path, thumb_path: p.thumb_path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, uid]);

  const photos = useMemo(() => {
    const waiting: Photo[] = ops.filter((o): o is Extract<Op, { t: "photo" }> => o.t === "photo").map((o) => ({
      id: o.id, basilica_id: o.bid, storage_path: "", thumb_path: "", caption: null, width: o.w, height: o.h,
      status: "waiting", created_at: new Date().toISOString(), local: o.thumb,
    }));
    return [...server, ...waiting];
  }, [server, ops]);

  const value: State = {
    visits, photos, pending: ops.length, online, syncing, lastError,
    checkIn, update, remove, addPhotos, deletePhoto, sync,
    thumbUrl: (p) => p.local || urls[p.thumb_path],
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
