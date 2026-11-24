import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, type ContextType } from "react";
import { Paper, T } from "../../src/components/ui";
import { AuthContext } from "../../src/lib/auth";
import { GallerySourceContext } from "../../src/lib/gallery";
import { VisitsContext } from "../../src/lib/visits";
import GalleryHome from "../../src/components/gallery/GalleryHome";
import { GalleryBasilicaScreen } from "../../src/components/gallery/GalleryBasilica";
import BasilicaScreen from "../basilica/[id]";

/** DEV-ONLY: the gallery screens with sample data, for previews and screenshots without signing in.
 *  /gallery/preview?s=home|basilica|reviews|questions|section[&m=expired][&mine=1]
 *  In a release build this screen shows nothing and the sample data is never used. */
// Required only in development builds, so release builds leave the sample data out of the app entirely.
const FIX: typeof import("../../src/lib/galleryFixtures") | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  process.env.NODE_ENV === "development" ? require("../../src/lib/galleryFixtures") : null;

export default function GalleryPreview() {
  const p = useLocalSearchParams<{ s?: string; m?: string; mine?: string; id?: string }>();
  if (!__DEV__ || !FIX) return <Paper><T style={{ padding: 20 }}>Not available.</T></Paper>;
  return <Preview s={p.s || "home"} m={p.m === "expired" ? "expired" : "trial"} mine={p.mine === "1"} />;
}

function Preview({ s, m, mine }: { s: string; m: "trial" | "expired"; mine: boolean }) {
  const F = FIX!;
  const { make, auth, visits } = useMemo(() => {
    const st = F.fixtureState(m, { myReview: mine });
    const auth = {
      ready: true, user: { id: F.FIX_UID, email: "pilgrim@example.com" } as any, displayName: "Pilgrim",
      sendCode: async () => {}, verifyCode: async () => {}, signOut: async () => {}, rename: async () => {},
    } satisfies ContextType<typeof AuthContext>;
    const myPhoto = { id: "p3", basilica_id: F.FIX_BASILICA, storage_path: "sample/x.jpg", thumb_path: "sample/x.t.jpg", caption: null, width: 2000, height: 1333, status: "approved", created_at: new Date().toISOString() };
    const visits = {
      visits: new Map([[F.FIX_BASILICA, { basilica_id: F.FIX_BASILICA, visited_on: new Date().toISOString().slice(0, 10), note: null }]]),
      photos: [myPhoto], pending: 0, online: true, syncing: false, lastError: null,
      checkIn: () => {}, update: () => {}, remove: () => {}, addPhotos: async () => 0, deletePhoto: () => {}, sync: () => {},
      thumbUrl: () => undefined,
    } satisfies ContextType<typeof VisitsContext>;
    return { make: F.makeFixtureSource(st), auth, visits };
  }, [F, m, mine]);

  const body = s === "home" ? <GalleryHome />
    : s === "section" ? <BasilicaScreen />
      : <GalleryBasilicaScreen id={F.FIX_BASILICA} tab={s === "reviews" ? "reviews" : s === "questions" ? "questions" : "photos"} />;
  return (
    <AuthContext.Provider value={auth}>
      <VisitsContext.Provider value={visits}>
        <GallerySourceContext.Provider value={make}>
          <Stack.Screen options={{ title: "Preview (sample data)", headerShown: s !== "home" }} />
          {body}
        </GallerySourceContext.Provider>
      </VisitsContext.Provider>
    </AuthContext.Provider>
  );
}
