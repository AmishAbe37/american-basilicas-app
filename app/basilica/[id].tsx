import { Stack, useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Ombrellino, Paper, T } from "../../src/components/ui";
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
  const imgW = Math.min(width, 700) - 32;
  const c = b.credit;
  return (
    <Paper>
      <Stack.Screen options={{ title: b.city }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, alignItems: "center" }}>
        <View style={{ width: imgW }}>
          {photo ? (
            <View style={s.frame}>
              <Image source={photo} style={{ width: imgW - 12, height: (imgW - 12) * ratio }} accessibilityLabel={`Photo of ${b.name}`} />
            </View>
          ) : null}
          <T style={s.credit}>
            {c ? `Photo: ${c.author}${c.license ? " · " + c.license : ""}${c.page ? " · Wikimedia Commons" : ""}` : "Photo: Wikimedia Commons"}
            {b.photoNote ? ` · ${b.photoNote}` : ""}
            {c?.page ? <T style={[s.credit, s.link]} onPress={() => openWeb(c.page!)}>  View source</T> : null}
          </T>

          <View style={s.titleRow}>
            <Ombrellino size={34} />
            <View style={{ flex: 1 }}>
              <T w="bold" style={s.name}>{b.name}</T>
              <T style={s.place}>{b.city}, {b.state}{b.year ? ` · Minor basilica since ${b.year}` : ""}</T>
            </View>
          </View>

          <View style={s.facts}>
            {b.facts.map((f, i) => (
              <View key={i} style={s.fact}>
                <T w="black" style={s.bullet}>{i + 1}</T>
                <T style={s.factText}>{f}</T>
              </View>
            ))}
          </View>

          <Pressable onPress={() => openDirections(b)} style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            <T w="bold" style={{ color: "#fff", fontSize: 17 }}>Directions</T>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {b.wiki ? (
              <Pressable onPress={() => openWeb(b.wiki!)} style={({ pressed }) => [s.btn2, pressed && { opacity: 0.8 }]} accessibilityRole="link">
                <T w="bold" style={s.btn2Text}>Wikipedia</T>
              </Pressable>
            ) : null}
            <Pressable onPress={() => openWeb(`https://americanbasilicas.org/basilica.html?b=${encodeURIComponent(b.id)}`)}
              style={({ pressed }) => [s.btn2, pressed && { opacity: 0.8 }]} accessibilityRole="link">
              <T w="bold" style={s.btn2Text}>Members&rsquo; photos</T>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Paper>
  );
}

const s = StyleSheet.create({
  frame: { padding: 5, backgroundColor: "#c99a2e", borderWidth: 1, borderColor: "#7d5a0e", borderRadius: 2, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  credit: { fontSize: 12, color: C.muted, marginTop: 6 },
  link: { color: C.red, textDecorationLine: "underline" },
  titleRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 18 },
  name: { fontSize: 24, lineHeight: 28 },
  place: { fontSize: 15, color: C.muted, marginTop: 4 },
  facts: { marginTop: 18, gap: 12, borderTopWidth: 1, borderTopColor: C.rule, paddingTop: 16 },
  fact: { flexDirection: "row", gap: 10 },
  bullet: { color: C.red, fontSize: 16, width: 16 },
  factText: { flex: 1, fontSize: 16, lineHeight: 23 },
  btn: { marginTop: 24, backgroundColor: C.red, borderRadius: 8, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  btn2: { flex: 1, borderWidth: 1.5, borderColor: C.red, borderRadius: 8, paddingVertical: 11, alignItems: "center", backgroundColor: "#fffdf8" },
  btn2Text: { color: C.red, fontSize: 16 },
});
