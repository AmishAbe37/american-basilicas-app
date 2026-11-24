import { router, Stack } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { byId, type Basilica } from "../../data/basilicas";
import { useAuth } from "../../lib/auth";
import { useGalleryBasics, useGallerySource, type Tab } from "../../lib/gallery";
import { useVisits } from "../../lib/visits";
import { C } from "../../theme";
import { Card, Cosmati, EnamelButton, Kicker, Lacquer, Ombrellino, Paper, T, Valance, letterpress } from "../ui";
import BasilicaGallery from "./BasilicaGallery";
import { gs, Link, Loading, MemberNote, Msg, SmallButton } from "./bits";
import ReviewBlock from "./ReviewBlock";

const toPage = (b: Basilica) => router.push({ pathname: "/basilica/[id]", params: { id: b.id } });
/** The member's photos of a basilica that have reached the website (a review needs at least one). */
const useMyPhotos = (bid: string) => {
  const V = useVisits();
  const mine = V.photos.filter((p) => p.basilica_id === bid);
  return { uploaded: mine.filter((p) => !p.local).length, waiting: mine.filter((p) => p.local).length, visited: V.visits.has(bid) };
};

/** One basilica in the members' gallery: its own screen, opened from the Gallery tab. */
export function GalleryBasilicaScreen({ id, tab }: { id: string; tab?: Tab }) {
  const b = byId(id);
  const { user, displayName } = useAuth();
  const src = useGallerySource(user?.id);
  const basics = useGalleryBasics(src);
  const mine = useMyPhotos(id);
  if (!b) return <Paper><T style={{ padding: 20 }}>We couldn’t find that basilica. Choose one in the Gallery tab.</T></Paper>;
  return (
    <Paper>
      <Stack.Screen options={{ title: b.city, headerBackTitle: "Gallery", headerBackground: () => <Lacquer style={{ flex: 1 }} /> }} />
      <Valance style={{ marginBottom: -10 }} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 26, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={s.titleRow}>
          <View style={{ paddingTop: 3 }}><Ombrellino size={30} /></View>
          <View style={{ flex: 1 }}>
            <T w="bold" style={s.name}>{b.name}</T>
            <T style={s.place}>{b.city}, {b.state}</T>
          </View>
        </View>
        <T style={[gs.hint, { marginTop: 10 }]}>
          <Link onPress={() => toPage(b)}>{mine.visited ? "Basilica page and your visit" : "Basilica page"}</Link>
          {mine.visited ? null : <>{"  ·  "}<Link onPress={() => toPage(b)}>Been here? Check it off</Link></>}
        </T>
        <Cosmati style={{ marginVertical: 16 }} />
        {!user ? <SignedOut b={b} /> : !src || (!basics.M && !basics.error) ? <Loading /> : basics.error ? (
          <Card><Msg text={basics.error} kind="err" /><View style={{ flexDirection: "row", paddingVertical: 10 }}><SmallButton label="Try again" onPress={basics.reload} /></View></Card>
        ) : (
          <View style={{ gap: 14 }}>
            {basics.offlineSince ? <MemberNote M={basics.M!} offlineSince={basics.offlineSince} /> : null}
            <BasilicaGallery b={b} src={src} M={basics.M!} counts={basics.counts?.[b.id]} visited={mine.visited} myPhotos={mine.uploaded}
              myName={displayName} onRecheck={basics.recheck} initialTab={tab} />
          </View>
        )}
      </ScrollView>
    </Paper>
  );
}

function SignedOut({ b }: { b: Basilica }) {
  return (
    <Card>
      <Kicker>Members only</Kicker>
      <T style={[gs.text, { marginTop: 8 }]}>Members share photos and reviews of {b.name}, ask questions about visiting, and answer each other’s.</T>
      <T style={[gs.text, { marginTop: 10 }]}>
        <T w="bold" style={gs.text}>New accounts get the members’ gallery free for three months.</T> After that, the gallery is for subscribers. Your own map, visits and photos are always free.
      </T>
      <View style={{ paddingVertical: 14 }}><EnamelButton label="Sign in" onPress={() => router.push("/signin")} /></View>
    </Card>
  );
}

/** On a basilica's page, under "Your visit": a gentle prompt to review once the visit has photos (members/visit.js),
 *  then "Shared by members" with photos, reviews and Q&A (basilica.html). */
export function BasilicaMembers({ b }: { b: Basilica }) {
  const { user, displayName } = useAuth();
  const src = useGallerySource(user?.id);
  const basics = useGalleryBasics(src);
  const mine = useMyPhotos(b.id);
  return (
    <>
      {user && src && mine.visited ? (
        <Card style={{ marginTop: 14 }}>
          <View style={{ paddingVertical: 8 }}>
            {mine.uploaded ? <ReviewBlock b={b} src={src} photos={mine.uploaded} />
              : mine.waiting ? <T style={gs.hint}><T w="bold" style={gs.hint}>Reviews:</T> your photos are still on this phone. Once they’ve been sent, you can write a review for other members.</T>
                : <T style={gs.hint}><T w="bold" style={gs.hint}>Reviews:</T> add a photo from your visit, and you can then write a review for other members.</T>}
          </View>
        </Card>
      ) : null}

      <Cosmati style={{ marginTop: 22, marginBottom: 14 }} />
      <View style={s.bar}>
        <T w="bold" style={s.h2}>Shared by members</T>
        <T style={gs.hint}>{b.city}, {b.state}</T>
      </View>
      {!user ? <SignedOut b={b} /> : !src || (!basics.M && !basics.error) ? <Loading /> : basics.error ? (
        <Msg text={basics.error} kind="err" />
      ) : (
        <View style={{ gap: 14 }}>
          <MemberNote M={basics.M!} offlineSince={basics.offlineSince} />
          <BasilicaGallery b={b} src={src} M={basics.M!} counts={basics.counts?.[b.id]} visited={mine.visited} myPhotos={mine.uploaded}
            myName={displayName} onRecheck={basics.recheck} reviewMine={mine.visited ? "above" : "here"} />
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  name: { fontSize: 22, lineHeight: 26, color: "#241d12", ...letterpress },
  place: { fontSize: 14.5, color: C.muted, marginTop: 3 },
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 6, marginBottom: 12, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  h2: { fontSize: 19, color: "#241d12", ...letterpress },
});
