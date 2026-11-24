import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { Basilica } from "../data/basilicas";
import { lengthLabel, toursFor, type Tour } from "../data/tours";
import { useTourProgress } from "../lib/tourProgress";
import { C } from "../theme";
import { SampleStamp } from "./TourParts";
import { Card, Kicker, T } from "./ui";

/** "Day tours" on a basilica's page. Shows nothing when no tour includes this basilica. */
export default function DayTours({ b }: { b: Basilica }) {
  const tours = toursFor(b.id);
  if (!tours.length) return null;
  return (
    <View style={{ marginTop: 22 }}>
      <Kicker>Day tours</Kicker>
      <T style={s.sub}>
        A day planned around {tours.length > 1 ? "these basilicas" : "this basilica"}: the visit, a local lunch, sights nearby and the gift shop.
      </T>
      <Card>
        {tours.map((t, i) => <Row key={t.id} t={t} first={i === 0} />)}
      </Card>
    </View>
  );
}

function Row({ t, first }: { t: Tour; first: boolean }) {
  const { progress } = useTourProgress(t.id, t.stops.length);
  const status = progress?.finished ? "Finished" : progress ? `In progress: stop ${progress.current + 1} of ${t.stops.length}` : null;
  const shared = t.basilica_ids.length > 1 ? `${t.basilica_ids.length} basilicas  ·  ` : "";
  return (
    <Pressable onPress={() => router.push(`/tour/${t.id}`)} accessibilityRole="link" accessibilityLabel={`${t.title}, day tour`}
      style={({ pressed }) => [s.row, !first && s.rule, pressed && { backgroundColor: "rgba(185,166,120,.15)" }]}>
      <View style={{ flex: 1 }}>
        {t.sample ? <SampleStamp style={{ marginBottom: 6 }} /> : null}
        <T w="bold" style={s.title}>{t.title}</T>
        <T style={s.meta}>{shared}{lengthLabel(t.length_hours)}  ·  {t.stops.length} stops</T>
        <T style={s.meta}>Best: {t.best_days}</T>
        {status ? <T w="semibold" style={s.status}>{status}</T> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#a8996f" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  sub: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 6, paddingBottom: 11 },
  rule: { borderTopWidth: 1, borderTopColor: C.hair, paddingTop: 11 },
  title: { fontSize: 16.5, lineHeight: 21, color: "#7a1f1f" },
  meta: { fontSize: 13.5, lineHeight: 19, color: C.muted, marginTop: 2 },
  status: { fontSize: 13, color: "#2f6b3a", marginTop: 4 },
});
