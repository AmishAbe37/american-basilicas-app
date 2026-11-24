import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { FlatList, Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASILICAS, BY_STATE, type Basilica } from "../../data/basilicas";
import { useAuth } from "../../lib/auth";
import { countLine, countTotal, useGalleryBasics, useGallerySource, type Counts } from "../../lib/gallery";
import { useVisits } from "../../lib/visits";
import { C, F } from "../../theme";
import { Band, Card, Enamel, EnamelButton, Kicker, OMB, Paper, T, Valance, letterpress } from "../ui";
import { gs, Loading, MemberNote, Msg, SmallButton } from "./bits";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ZERO: Counts = { photos: 0, reviews: 0, questions: 0 };
const open = (b: Basilica) => router.push({ pathname: "/gallery/[id]", params: { id: b.id } });

/** The members' gallery tab (gallery.html): where the member stands, what's been shared so far, and every basilica
 *  with its counts to choose from. Counts come from gallery_counts and question_counts, open to every member. */
export default function GalleryHome() {
  const { user } = useAuth();
  const src = useGallerySource(user?.id);
  const { M, counts, offlineSince, error, reload } = useGalleryBasics(src);
  const { visits } = useVisits();
  const [q, setQ] = useState("");
  const cnt = (id: string) => counts?.[id] || ZERO;

  const sections = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return BY_STATE;
    return BY_STATE.map((s) => ({ ...s, data: s.data.filter((b) => norm(`${b.name} ${b.city} ${b.state}`).includes(n)) })).filter((s) => s.data.length);
  }, [q]);

  if (!user) {
    return (
      <Shell>
        <View style={{ padding: 14, paddingTop: 24 }}>
          <Card>
            <View style={s.bar}><Kicker>Members only</Kicker><T style={s.tag}>Sign in to see the gallery</T></View>
            <T style={[gs.text, { marginTop: 8 }]}>The members’ gallery holds photos, reviews, and questions and answers from members, basilica by basilica on the map.</T>
            <T style={[gs.text, { marginTop: 10 }]}>
              <T w="bold" style={gs.text}>New accounts get the members’ gallery free for three months.</T> After that, the gallery is for subscribers. Your own map, visits and photos are always free.
            </T>
            <View style={{ paddingVertical: 14 }}><EnamelButton label="Sign in" onPress={() => router.push("/signin")} /></View>
          </Card>
        </View>
      </Shell>
    );
  }

  const tot = counts ? Object.values(counts).reduce((a, c) => ({ photos: a.photos + c.photos, reviews: a.reviews + c.reviews, questions: a.questions + c.questions }), { ...ZERO }) : ZERO;
  const top = counts ? BASILICAS.filter((b) => countTotal(cnt(b.id))).sort((a, b) => countTotal(cnt(b.id)) - countTotal(cnt(a.id))).slice(0, 8) : [];

  const header = (
    <View style={{ gap: 14, marginBottom: 14 }}>
      {M ? <MemberNote M={M} offlineSince={offlineSince} /> : null}
      {error ? (
        <Card><Msg text={error} kind="err" /><View style={{ flexDirection: "row", paddingVertical: 10 }}><SmallButton label="Try again" onPress={reload} /></View></Card>
      ) : !counts ? <Loading /> : (
        <>
          <Card>
            <Kicker style={{ paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule }}>Choose a basilica</Kicker>
            <T style={[gs.text, { marginTop: 8 }]}>
              Choose a basilica to see what members have shared: photos you can like, reviews of what they enjoyed, and <T w="bold" style={gs.text}>questions</T> you can ask and answer. Each basilica also has its own page with all three.
            </T>
            <View style={s.legend}>
              <View style={s.key}><Image source={OMB} style={s.omb} /><T style={gs.hint}>Has photos, reviews or questions</T></View>
              <View style={s.key}><Image source={OMB} style={[s.omb, s.none]} /><T style={gs.hint}>Nothing shared yet</T></View>
            </View>
            <T w="semibold" style={[gs.hint, { color: "#4a4030", marginBottom: 10 }]}>{countLine(tot)} shared so far</T>
          </Card>
          <Card>
            <Kicker style={{ paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule }}>Most shared so far</Kicker>
            {top.length ? top.map((b, i) => <Row key={b.id} b={b} c={cnt(b.id)} visited={visits.has(b.id)} last={i === top.length - 1} showState />)
              : <T style={[gs.text, { marginVertical: 10, fontStyle: "italic" }]}>Nothing has been shared yet. Add photos to your visits in My pilgrimage and they’ll appear here once approved.</T>}
          </Card>
          <TextInput value={q} onChangeText={setQ} placeholder="Find a basilica by name, city or state" placeholderTextColor="#8a7d63"
            style={s.search} clearButtonMode="while-editing" autoCorrect={false} returnKeyType="search" accessibilityLabel="Find a basilica" />
        </>
      )}
    </View>
  );

  return (
    <Shell>
      <FlatList
        data={counts ? sections : []}
        keyExtractor={(x) => x.state}
        contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={counts ? <T style={{ padding: 8, color: C.muted }}>No basilica matches “{q}”.</T> : null}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 14 }}>
            <View style={s.h3}><T w="black" style={s.stname}>{item.state}</T><Enamel>{item.data.length}</Enamel></View>
            {item.data.map((b, i) => <Row key={b.id} b={b} c={cnt(b.id)} visited={visits.has(b.id)} last={i === item.data.length - 1} />)}
          </Card>
        )}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band kicker="American Basilicas · Members" title="Members’" thin="Gallery" />
      <Valance style={{ marginBottom: -9 }} />
      <Paper>{children}</Paper>
    </SafeAreaView>
  );
}

/** A basilica in the chooser (the site's .glist row): canopy, city · name, ✓ if visited, what's been shared. */
function Row({ b, c, visited, last, showState }: { b: Basilica; c: Counts; visited: boolean; last?: boolean; showState?: boolean }) {
  const has = countTotal(c) > 0;
  return (
    <Pressable onPress={() => open(b)} style={({ pressed }) => [s.row, !last && s.dotted, pressed && s.pressed]} accessibilityRole="button"
      accessibilityLabel={`${b.name}, ${b.city}: ${countLine(c)}${visited ? ". You’ve visited" : ""}`}>
      <Image source={OMB} style={[s.omb, !has && s.none, { marginTop: 2 }]} />
      <View style={{ flex: 1 }}>
        <T style={s.name}>
          <T w="bold" style={s.name}>{b.city}{showState ? `, ${b.state}` : ""}</T> · {b.name}
          {visited ? <T w="black" style={[s.name, { color: "#33418a" }]} accessibilityLabel="You’ve visited">  ✓</T> : null}
        </T>
        <T style={[s.cl, !has && { color: "#9a8f78" }]}>{countLine(c)}</T>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  tag: { fontSize: 12, color: C.muted },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10, marginBottom: 6 },
  key: { flexDirection: "row", alignItems: "center", gap: 5 },
  omb: { width: 12, height: 18, resizeMode: "contain" },
  none: { opacity: 0.3 },
  search: { fontFamily: F.regular, fontSize: 16, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  h3: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 5, marginBottom: 2, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  stname: { fontSize: 16, color: "#241d12", letterSpacing: 0.2, ...letterpress },
  row: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  dotted: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  pressed: { backgroundColor: "rgba(217,165,33,.18)" },
  name: { fontSize: 14.5, lineHeight: 19, color: "#2a2318" },
  cl: { fontSize: 12.5, color: C.red, marginTop: 2 },
});
