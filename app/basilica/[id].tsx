import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Cosmati, EnamelButton, GiltFrame, Lacquer, Ombrellino, Paper, T, Valance, letterpress } from "../../src/components/ui";
import VisitPanel from "../../src/components/VisitPanel";
import { byId } from "../../src/data/basilicas";
import { PHOTO_RATIO, PHOTOS } from "../../src/data/photos";
import { openDirections, openWeb } from "../../src/lib/open";
import { C } from "../../src/theme";

export default function BasilicaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = byId(String(id));
  const { width } = useWindowDimensions();
  if (!b) return <Paper><T style={{ padding: 20 }}>This basilica isn&rsquo;t in the list.</T></Paper>;
  const photo = PHOTOS[b.id];
  const ratio = PHOTO_RATIO[b.id] || 0.66;
  const colW = Math.min(width, 640) - 28;          // card content width
  const imgW = colW - 2 * 7 - 2;                   // inside the gilt frame
  const c = b.credit;
  return (
    <Paper>
      <Stack.Screen options={{ title: b.city, headerBackground: () => <Lacquer style={{ flex: 1 }} /> }} />
      <Valance style={{ marginBottom: -10 }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 26, paddingBottom: 40, alignItems: "center" }}>
        <View style={{ width: colW }}>
          {photo ? (
            <GiltFrame>
              <Image source={photo} style={{ width: imgW, height: imgW * ratio }} accessibilityLabel={`Photo of ${b.name}`} />
            </GiltFrame>
          ) : null}
          <T style={s.credit}>
            {c ? `Photo: ${c.author}` : "Photo: Wikimedia Commons"}
            {c?.license ? " · " : ""}
            {c?.license ? (c.licenseUrl ? <T style={[s.credit, s.link]} onPress={() => openWeb(c.licenseUrl!)}>{c.license}</T> : c.license) : null}
            {c?.page ? <>{" · "}<T style={[s.credit, s.link]} onPress={() => openWeb(c.page!)}>Wikimedia Commons ↗</T></> : null}
            {b.photoNote ? ` · ${b.photoNote}` : ""}
          </T>

          <View style={s.titleRow}>
            <View style={{ paddingTop: 3 }}><Ombrellino size={34} /></View>
            <View style={{ flex: 1 }}>
              <T w="bold" style={s.name}>{b.name}</T>
              <T style={s.place}>{b.city}, {b.state}{b.year ? `  ·  Basilica since ${b.year}` : ""}</T>
            </View>
          </View>

          <View style={s.facts}>
            {b.facts.map((f, i) => (
              <View key={i} style={s.fact}>
                <T w="black" style={s.num}>{i + 1}.</T>
                <T style={s.factText}>{f}</T>
              </View>
            ))}
          </View>

          <View style={s.links}>
            {b.wiki ? <T w="semibold" style={s.alink} onPress={() => openWeb(b.wiki!)}>Wikipedia article ↗</T> : null}
            {b.commons ? <T w="semibold" style={s.alink} onPress={() => openWeb(b.commons!)}>More photos on Wikimedia Commons ↗</T> : null}
          </View>

          <Cosmati style={{ marginTop: 18, marginBottom: 18 }} />

          <EnamelButton label="Directions" onPress={() => openDirections(b)} icon={<Ionicons name="navigate" size={17} color="#fff" />} />

          <VisitPanel b={b} />
        </View>
      </ScrollView>
    </Paper>
  );
}

const s = StyleSheet.create({
  credit: { fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 8, textAlign: "center" },
  link: { marginTop: 0, color: "#7a1f1f", textDecorationLine: "underline" },
  titleRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 18 },
  name: { fontSize: 24, lineHeight: 28, color: "#241d12", ...letterpress },
  place: { fontSize: 14.5, color: C.muted, marginTop: 4 },
  facts: { marginTop: 16, gap: 10 },
  fact: { flexDirection: "row", gap: 6 },
  num: { color: C.red, fontSize: 16, lineHeight: 24, width: 20 },
  factText: { flex: 1, fontSize: 16, lineHeight: 24, color: "#2a2318" },
  links: { marginTop: 14, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: "#d9cba6" },
  alink: { color: "#7a1f1f", fontSize: 15 },
  cardText: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
});
