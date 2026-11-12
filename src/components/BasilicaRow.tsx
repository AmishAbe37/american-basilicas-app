import { router } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { type Basilica } from "../data/basilicas";
import { PHOTOS } from "../data/photos";
import { C } from "../theme";
import { T } from "./ui";

export default function BasilicaRow({ b, right }: { b: Basilica; right?: string }) {
  return (
    <Pressable onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: C.paper2 }]} accessibilityRole="button">
      <Image source={PHOTOS[b.id]} style={s.thumb} />
      <View style={{ flex: 1 }}>
        <T w="semibold" style={{ fontSize: 16, lineHeight: 20 }} numberOfLines={2}>{b.name}</T>
        <T style={{ fontSize: 14, color: C.muted }}>{b.city}, {b.state}{b.year ? ` · since ${b.year}` : ""}</T>
      </View>
      {right ? <T w="bold" style={{ fontSize: 14, color: C.red }}>{right}</T> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hair },
  thumb: { width: 56, height: 56, borderRadius: 4, borderWidth: 2, borderColor: C.gold, backgroundColor: C.paper2 },
});
