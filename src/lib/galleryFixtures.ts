// DEV-ONLY sample data for previewing and screenshotting the gallery without signing in.
// Used only by app/gallery/preview.tsx, which refuses to render outside development builds.
// Nothing here is ever sent to the backend; the "server" is an in-memory object.
import { Asset } from "expo-asset";
import { PHOTOS } from "../data/photos";
import type { Counts, GAnswer, GPhoto, GQuestion, GReview, Membership, Source } from "./gallery";

export const FIX_UID = "00000000-0000-0000-0000-00000000fe00";
export const FIX_BASILICA = "st-louis-cathedral-basilica-of-st-louis-new-cathedral";
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const by = (name: string) => ({ profiles: { display_name: name } });

// stand-in pictures: the app's own bundled basilica photos
const PIC = [
  "st-louis-cathedral-basilica-of-st-louis-new-cathedral", "st-louis-basilica-of-st-louis-king-of-france-old-cathedral",
  "conception-basilica-of-the-immaculate-conception-conception-abbey", "new-orleans-cathedral-basilica-of-st-louis-king-of-france",
  "baltimore-basilica-of-the-national-shrine-of-the-assumption-of-the-bvm", "notre-dame-basilica-of-the-sacred-heart",
];
const photo = (i: number, name: string, likes: number, ago: number, caption: string | null, user = `u${i}`): GPhoto => ({
  id: `p${i}`, user_id: user, basilica_id: FIX_BASILICA, storage_path: `sample/${PIC[i % PIC.length]}.jpg`,
  thumb_path: `sample/${PIC[i % PIC.length]}.t.jpg`, caption, width: 2000, height: 1333, status: "approved",
  like_count: likes, created_at: day(ago), ...by(name),
});

export function fixtureState(kind: "trial" | "expired" = "trial", opts: { myReview?: boolean } = {}) {
  const membership: Membership = kind === "trial"
    ? { access: true, kind: "trial", joined: day(43), free_until: new Date(Date.now() + 47 * 86400000).toISOString(), paid_through: null, email: "pilgrim@example.com", welcomed_at: day(43) }
    : { access: false, kind: "expired", joined: day(120), free_until: day(28), paid_through: null, email: "pilgrim@example.com", welcomed_at: day(120) };
  const photos: GPhoto[] = [
    photo(0, "Maria G.", 14, 12, "The mosaics over the sanctuary — 41.5 million pieces of glass, and they still catch the morning light."),
    photo(1, "Fr. Thomas", 9, 30, "Afternoon light on the dome."),
    photo(2, "Joseph K.", 6, 4, null),
    photo(3, "Pilgrim", 3, 2, "Our first stop on the trip.", FIX_UID),
    photo(4, "Ann", 2, 60, "The baldachin."),
    photo(5, "Daniel R.", 0, 1, null),
  ];
  const reviews: GReview[] = [
    { id: "r1", user_id: "u1", basilica_id: FIX_BASILICA, body: "Go early on a weekday and sit for a while before Mass — the mosaics change as the light moves across the dome. The museum downstairs explains how they were made, and the docents are wonderful.", status: "approved", like_count: 11, created_at: day(20), updated_at: day(20), ...by("Maria G.") },
    { id: "r2", user_id: "u2", basilica_id: FIX_BASILICA, body: "The 10:00 Sunday Mass with the full choir is worth planning a trip around. Parking on the Lindell side was easy.", status: "approved", like_count: 7, created_at: day(41), updated_at: day(9), ...by("Fr. Thomas") },
    { id: "r3", user_id: "u3", basilica_id: FIX_BASILICA, body: "Bring binoculars if you have them. You will want to look up for a long time.", status: "approved", like_count: 2, created_at: day(3), updated_at: day(3), ...by("Joseph K.") },
  ];
  const questions: GQuestion[] = [
    { id: "q1", user_id: "u4", basilica_id: FIX_BASILICA, body: "Is there a guided tour of the mosaics on Saturdays, and do we need to book ahead?", status: "approved", answer_count: 2, author_visited: false, created_at: day(15), updated_at: day(15), ...by("Ann") },
    { id: "q2", user_id: FIX_UID, basilica_id: FIX_BASILICA, body: "Where is the best place to park for the Sunday 10:00 Mass?", status: "pending", answer_count: 0, author_visited: true, created_at: day(0), updated_at: day(0), ...by("Pilgrim") },
    { id: "q3", user_id: "u5", basilica_id: FIX_BASILICA, body: "Are photos allowed inside during the day?", status: "approved", answer_count: 0, author_visited: true, created_at: day(6), updated_at: day(6), ...by("Daniel R.") },
  ];
  const answers: GAnswer[] = [
    { id: "a1", question_id: "q1", user_id: "u1", body: "Yes — the free tours start after the noon Mass. We just showed up; no booking needed for a small group.", status: "approved", author_visited: true, created_at: day(14), updated_at: day(14), ...by("Maria G.") },
    { id: "a2", question_id: "q1", user_id: "u2", body: "Groups of ten or more should call the parish office first.", status: "approved", author_visited: true, created_at: day(12), updated_at: day(12), ...by("Fr. Thomas") },
  ];
  const mine: GReview | null = opts.myReview
    ? { id: "r9", user_id: FIX_UID, basilica_id: FIX_BASILICA, body: "We came for the mosaics and stayed for Vespers. Don’t miss the side chapels.", status: "pending", like_count: 0, created_at: day(1), updated_at: day(1) }
    : null;
  const counts: Record<string, Counts> = {
    [FIX_BASILICA]: { photos: photos.length, reviews: reviews.length, questions: 2 },
    "st-louis-basilica-of-st-louis-king-of-france-old-cathedral": { photos: 8, reviews: 3, questions: 1 },
    "washington-basilica-of-the-national-shrine-of-the-immaculate-conception": { photos: 12, reviews: 4, questions: 3 },
    "baltimore-basilica-of-the-national-shrine-of-the-assumption-of-the-bvm": { photos: 5, reviews: 2, questions: 0 },
    "notre-dame-basilica-of-the-sacred-heart": { photos: 4, reviews: 1, questions: 2 },
    "new-orleans-cathedral-basilica-of-st-louis-king-of-france": { photos: 3, reviews: 2, questions: 1 },
    "conception-basilica-of-the-immaculate-conception-conception-abbey": { photos: 2, reviews: 0, questions: 1 },
  };
  return { membership, photos, reviews, questions, answers, mine, counts, liked: new Set<string>(["p1", "r2"]) };
}

const page = <T,>(list: T[], o: { offset: number; limit: number }) => list.slice(o.offset, o.offset + o.limit);
const order = <T extends { like_count?: number; answer_count?: number; created_at: string }>(list: T[], sort: string, k: "like_count" | "answer_count") =>
  list.slice().sort((a, b) => (sort === "latest" ? 0 : ((b[k] as number) || 0) - ((a[k] as number) || 0)) || b.created_at.localeCompare(a.created_at));

export function makeFixtureSource(st: ReturnType<typeof fixtureState>) {
  return (uid: string): Source => ({
    uid,
    membership: async () => st.membership,
    counts: async () => st.counts,
    photosFor: async (_b, o) => page(order(st.photos, o.sort, "like_count"), o),
    reviewsFor: async (_b, o) => page(order(st.reviews, o.sort, "like_count"), o),
    questionsFor: async (_b, o) => page(order(st.questions, o.sort, "answer_count"), o),
    answersFor: async (ids) => st.answers.filter((a) => ids.includes(a.question_id)),
    urls: async (paths) => {
      const out: Record<string, string> = {};
      for (const p of paths) {
        const id = p.replace(/^sample\//, "").replace(/(\.t)?\.jpg$/, "");
        if (PHOTOS[id]) out[p] = Asset.fromModule(PHOTOS[id]).uri;
      }
      return out;
    },
    myLikes: async (_k, ids) => new Set(ids.filter((i) => st.liked.has(i))),
    like: async (_k, id) => { st.liked.add(id); },
    unlike: async (_k, id) => { st.liked.delete(id); },
    myReview: async () => st.mine,
    saveReview: async (bid, body, id) => {
      body = body.trim();
      if (body.length < 20) throw new Error("Write at least 20 characters.");
      st.mine = { id: id || "r9", user_id: uid, basilica_id: bid, body, status: "pending", like_count: 0, created_at: st.mine?.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
      return st.mine;
    },
    deleteReview: async () => { st.mine = null; },
    ask: async (bid, body) => {
      const q: GQuestion = { id: `q${Date.now()}`, user_id: uid, basilica_id: bid, body: body.trim(), status: "pending", answer_count: 0, author_visited: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      st.questions.unshift(q); return q;
    },
    answer: async (qid, body) => {
      const a: GAnswer = { id: `a${Date.now()}`, question_id: qid, user_id: uid, body: body.trim(), status: "pending", author_visited: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      st.answers.push(a); return a;
    },
    deleteQuestion: async (id) => { st.questions = st.questions.filter((q) => q.id !== id); },
    deleteAnswer: async (id) => { st.answers = st.answers.filter((a) => a.id !== id); },
  });
}
