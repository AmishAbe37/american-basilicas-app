import { router } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { type Basilica } from "../data/basilicas";
import { PHOTOS } from "../data/photos";
import { C } from "../theme";
import { GiltFrame, T } from "./ui";

/** A basilica in a card list: small gilt-framed photo, name, place; optional figure on the right. */
export default function BasilicaRow({ b, right, last }: { b: Basilica; right?: string; last?: boolean }) {
  return (
    <Pressable onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })}
      style={({ pressed }) => [s.row, !last && s.sep, pressed && s.pressed]} accessibilityRole="button">
      <GiltFrame width={3}><Image source={PHOTOS[b.id]} style={s.thumb} /></GiltFrame>
      <View style={{ flex: 1 }}>
        <T w="semibold" style={{ fontSize: 15.5, lineHeight: 19, color: "#2a2318" }} numberOfLines={2}>{b.name}</T>
        <T style={{ fontSize: 13.5, color: "#4a4030" }}><T w="bold" style={{ fontSize: 13.5, color: "#4a4030" }}>{b.city}</T>, {b.state}</T>
      </View>
      {right ? <T w="black" style={{ fontSize: 14, color: C.red }}>{right}</T> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  sep: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  pressed: { backgroundColor: "rgba(217,165,33,.16)" },
  thumb: { width: 50, height: 50 },
});
