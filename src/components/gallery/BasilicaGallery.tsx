import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Basilica } from "../../data/basilicas";
import {
  fmtDate, PAGE, readCache, SORTS, TABS, transient, when, who, writeCache,
  type Counts, type GAnswer, type GPhoto, type GQuestion, type GReview, type Membership, type Sort, type Source, type Tab,
} from "../../lib/gallery";
import { C } from "../../theme";
import { GiltFrame, T } from "../ui";
import { gs, LikeButton, Link, Loading, Msg, NoAccess, Offline, Segments, SmallButton } from "./bits";
import PhotoViewer, { photoSource } from "./PhotoViewer";
import { AskBox, QuestionCard } from "./QA";
import ReviewBlock from "./ReviewBlock";

type Item = GPhoto | GReview | GQuestion;
type Snapshot = { items: Item[]; urls: Record<string, string>; liked: string[]; answers: Record<string, GAnswer[]>; more: boolean };

/** One basilica's members' content: photos, reviews, and questions & answers, each sortable (members/bview.js).
 *  The last-loaded first page of each tab and order is kept on the phone, so it still shows with no signal. */
export default function BasilicaGallery({ b, src, M, counts, visited, myPhotos, myName, onRecheck, reviewMine = "here", initialTab = "photos" }: {
  b: Basilica; src: Source; M: Membership; counts?: Partial<Counts>; visited: boolean; myPhotos: number; myName: string | null;
  onRecheck: () => Promise<Membership | null>;
  /** where the member's own review lives: in the Reviews tab, or with their visit higher up the same screen */
  reviewMine?: "here" | "above"; initialTab?: Tab;
}) {
  const c: Counts = { photos: 0, reviews: 0, questions: 0, ...(counts || {}) };
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState<Sort>("popular");
  const [snap, setSnap] = useState<Snapshot>({ items: [], urls: {}, liked: [], answers: {}, more: false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const seq = useRef(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((t: string) => {
    setNote(t); if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 4500);
  }, []);
  const key = `b.${b.id}.${tab}.${sort}`;

  const fetchPage = useCallback(async (offset: number, have: Item[]) => {
    const limit = PAGE[tab];
    if (tab === "questions") {
      const batch = await src.questionsFor(b.id, { sort, offset, limit });
      const fresh = batch.filter((x) => !have.some((y) => y.id === x.id));
      const ans = fresh.length ? await src.answersFor(fresh.map((q) => q.id)) : [];
      const answers: Record<string, GAnswer[]> = {};
      fresh.forEach((q) => (answers[q.id] = ans.filter((a) => a.question_id === q.id)));
      return { fresh, n: batch.length, urls: {}, liked: [] as string[], answers };
    }
    const batch = await (tab === "photos" ? src.photosFor : src.reviewsFor)(b.id, { sort, offset, limit });
    const fresh = (batch as Item[]).filter((x) => !have.some((y) => y.id === x.id));
    const [urls, liked] = await Promise.all([
      tab === "photos" ? src.urls((fresh as GPhoto[]).map((p) => p.thumb_path)) : Promise.resolve({} as Record<string, string>),
      src.myLikes(tab === "photos" ? "photo" : "review", fresh.map((x) => x.id)),
    ]);
    return { fresh, n: batch.length, urls, liked: [...liked], answers: {} as Record<string, GAnswer[]> };
  }, [b.id, src, tab, sort]);

  // first page: what's on the phone at once, then fresh from the server
  useEffect(() => {
    if (!M.access) return;
    const my = ++seq.current;
    setSnap({ items: [], urls: {}, liked: [], answers: {}, more: false }); setErr(null); setOfflineSince(null); setLoading(true);
    (async () => {
      const cached = await readCache<Snapshot>(src.uid, key);
      if (my !== seq.current) return;
      if (cached) setSnap(cached.data);
      try {
        const r = await fetchPage(0, []);
        if (my !== seq.current) return;
        const next = { items: r.fresh, urls: r.urls, liked: r.liked, answers: r.answers, more: r.n >= PAGE[tab] };
        setSnap(next); writeCache(src.uid, key, next);
      } catch (e: any) {
        if (my !== seq.current) return;
        if (cached) setOfflineSince(cached.at);
        else setErr(transient(e) ? "You’re offline, and this hasn’t been loaded on this phone yet. It will appear when you have signal." : e?.message || String(e));
      }
      if (my === seq.current) setLoading(false);
    })();
  }, [key, M.access, src, fetchPage, tab]);

  async function more() {
    const my = seq.current;
    setLoading(true); setErr(null);
    try {
      const r = await fetchPage(snap.items.length, snap.items);
      if (my !== seq.current) return;
      setSnap((s0) => ({
        items: [...s0.items, ...r.fresh], urls: { ...s0.urls, ...r.urls }, liked: [...s0.liked, ...r.liked],
        answers: { ...s0.answers, ...r.answers }, more: r.n >= PAGE[tab],
      }));
    } catch (e: any) { if (my === seq.current) setErr(transient(e) ? "You’re offline. Loading more needs a connection." : e?.message || String(e)); }
    if (my === seq.current) setLoading(false);
  }

  if (!M.access) return <NoAccess M={M} name={b.name} counts={c} onRecheck={onRecheck} />;

  const liked = new Set(snap.liked);
  const setLike = async (kind: "photo" | "review", x: GPhoto | GReview, on: boolean) => {
    await (on ? src.like(kind, x.id) : src.unlike(kind, x.id));
    setSnap((s0) => ({
      ...s0,
      items: s0.items.map((y) => (y.id === x.id ? { ...y, like_count: Math.max(0, (y as GPhoto).like_count + (on ? 1 : -1)) } : y)),
      liked: on ? [...s0.liked, x.id] : s0.liked.filter((id) => id !== x.id),
    }));
  };
  const [s1, s2] = SORTS[tab];
  const photos = snap.items as GPhoto[];
  const empty = !loading && !err && !snap.items.length;

  return (
    <View style={{ gap: 12 }}>
      <Segments<Tab> value={tab} onChange={setTab}
        items={(Object.keys(TABS) as Tab[]).map((k) => ({ k, label: TABS[k], n: c[k] || 0 }))} />
      <Segments<Sort> small label="Sort" value={sort} onChange={setSort} items={[{ k: "popular", label: s1 }, { k: "latest", label: s2 }]} />

      {tab === "reviews" ? (
        reviewMine === "above" ? null
          : !visited ? (
            <T style={gs.hint}>
              Reviews come from members who’ve logged a visit with photos. Been here?{" "}
              <Link onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })}>Add your visit</Link>.
            </T>
          ) : (
            <ReviewBlock b={b} src={src} photos={myPhotos} ineligible={
              <T style={gs.hint}>Add a photo from your visit in{" "}
                <Link onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })}>your visit</Link> to leave a review.</T>} />
          )
      ) : null}
      {tab === "questions" ? (
        <AskBox bid={b.id} src={src} myName={myName}
          onAsked={(q) => setSnap((s0) => ({ ...s0, items: [q, ...s0.items], answers: { ...s0.answers, [q.id]: [] } }))} />
      ) : null}

      {note ? <Msg text={note} kind="err" /> : null}
      {offlineSince ? <Offline since={offlineSince} /> : null}

      {tab === "photos" && photos.length ? (
        <View style={s.grid}>
          {photos.map((p, i) => (
            <View key={p.id} style={s.ph}>
              <Pressable onPress={() => setViewer(i)} accessibilityRole="imagebutton" accessibilityLabel={`Open photo by ${who(p)}`}>
                <GiltFrame width={3}>
                  <Image source={photoSource(snap.urls[p.thumb_path], p.thumb_path)} style={s.thumb} contentFit="cover" transition={120}
                    accessibilityLabel={p.caption || b.name} />
                </GiltFrame>
              </Pressable>
              <View style={s.meta}>
                <T style={s.by} numberOfLines={2}>by <T w="bold" style={s.by}>{who(p)}</T>{"\n"}{fmtDate(p.created_at)}</T>
                <LikeButton kind="photo" count={p.like_count} liked={liked.has(p.id)} own={p.user_id === src.uid}
                  onToggle={(on) => setLike("photo", p, on)} onMessage={say} />
              </View>
              {p.caption ? <T style={s.cap} numberOfLines={3}>{p.caption}</T> : null}
            </View>
          ))}
        </View>
      ) : null}

      {tab === "reviews" ? (snap.items as GReview[]).map((r) => (
        <View key={r.id} style={s.rv}>
          <View style={s.rvHead}><T w="bold" style={s.who}>{who(r)}</T><T style={gs.hint}>{when(r)}</T></View>
          <T style={[gs.text, { marginTop: 6 }]}>{r.body}</T>
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <LikeButton kind="review" count={r.like_count} liked={liked.has(r.id)} own={r.user_id === src.uid}
              onToggle={(on) => setLike("review", r, on)} onMessage={say} />
          </View>
        </View>
      )) : null}

      {tab === "questions" ? (snap.items as GQuestion[]).map((q) => (
        <QuestionCard key={`${q.id}:${(snap.answers[q.id] || []).length}`} q={q} answers={snap.answers[q.id] || []} src={src} myName={myName}
          onDeleted={() => setSnap((s0) => ({ ...s0, items: s0.items.filter((y) => y.id !== q.id) }))} />
      )) : null}

      {loading ? <Loading /> : null}
      {err ? <Msg text={err} kind="err" /> : null}
      {empty ? (
        <T style={[gs.hint, { fontStyle: "italic", fontSize: 14 }]}>
          {tab === "photos" ? `No member photos of this basilica yet.${visited ? " Add yours from your visit." : " Been here? Check it off and add yours."}`
            : tab === "reviews" ? "No reviews of this basilica yet." : "No questions about this basilica yet. Ask the first one above."}
        </T>
      ) : null}
      {snap.more && !loading && !offlineSince ? <View style={{ flexDirection: "row" }}><SmallButton label="Load more" onPress={more} /></View> : null}

      {viewer != null ? (
        <PhotoViewer items={photos} start={viewer} name={b.name} thumbs={snap.urls} src={src} liked={liked}
          onLike={(p, on) => setLike("photo", p, on)} onMessage={say} onClose={() => setViewer(null)} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  ph: { width: "48%" },
  thumb: { width: "100%", aspectRatio: 1, backgroundColor: C.paper2 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginTop: 6 },
  by: { flex: 1, fontSize: 12, lineHeight: 16, color: "#4a4030" },
  cap: { fontSize: 13, lineHeight: 18, color: "#2a2318", marginTop: 4, fontStyle: "italic" },
  rv: { backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#d3c3a0", borderRadius: 9, padding: 12 },
  rvHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  who: { fontSize: 14.5, color: "#2a2318", flexShrink: 1 },
});
