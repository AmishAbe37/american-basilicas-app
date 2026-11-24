import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BADGE_LABEL, KIND_LABEL, clock, duration, type Tour, type TourStop } from "../data/tours";
import { openDirectionsTo, openRide, type Place } from "../lib/open";
import { C, F } from "../theme";
import { Card, ENAMEL, Enamel, GILT, Kicker, Ombrellino, PorcelainButton, T, engraved, letterpress } from "./ui";

// Pieces shared by the day-tour screens: the timeline, a stop's details, the ride and directions buttons.

const ICON: Record<TourStop["kind"], ComponentProps<typeof Ionicons>["name"] | null> = {
  basilica: null, meal: "restaurant-outline", sight: "camera-outline", shop: "gift-outline", dinner: "wine-outline", other: "location-outline",
};

export function KindIcon({ kind, size = 18 }: { kind: TourStop["kind"]; size?: number }) {
  const name = ICON[kind];
  return name ? <Ionicons name={name} size={size} color={C.red} /> : <Ombrellino size={size + 4} />;
}

export const place = (s: { name: string; address?: string; lat: number; lng: number }): Place =>
  ({ name: s.name, address: s.address, lat: s.lat, lng: s.lng });

/** A red rubber stamp for the dev-only sample fixture, so it can never be mistaken for a real tour. */
export function SampleStamp({ style }: { style?: ComponentProps<typeof View>["style"] }) {
  return (
    <View style={[s.sample, style]} accessibilityLabel="Sample tour with placeholder stops">
      <T w="black" style={s.sampleText}>SAMPLE · PLACEHOLDER STOPS</T>
    </View>
  );
}

/** "Member approved" or "Founder tested"; the default algorithm pick shows no badge. */
export function BadgeChip({ badge }: { badge: TourStop["badge"] }) {
  const label = BADGE_LABEL[badge];
  if (!label) return null;
  return (
    <LinearGradient colors={["#fbeab0", "#e7c35a"]} style={s.badge}>
      <Ionicons name={badge === "founder" ? "ribbon" : "people"} size={12} color="#5b3f08" />
      <T w="bold" style={s.badgeText}>{label}</T>
    </LinearGradient>
  );
}

/** Time, length and kind, in small capitals: "LUNCH · 11:15 AM · 1 HR". */
export function StopMeta({ stop }: { stop: TourStop }) {
  const bits = [KIND_LABEL[stop.kind], clock(stop.time), duration(stop.minutes)].filter(Boolean);
  return <Kicker style={s.meta}>{bits.join("  ·  ")}</Kicker>;
}

/** Opening hours and the backup stop. */
export function StopFacts({ stop }: { stop: TourStop }) {
  return (
    <>
      {stop.hours ? (
        <View style={s.line}>
          <Ionicons name="time-outline" size={14} color={C.muted} style={{ marginTop: 2 }} />
          <T style={s.small}>{stop.hours}</T>
        </View>
      ) : null}
      {stop.backup ? (
        <View style={s.line}>
          <Ionicons name="swap-horizontal" size={14} color={C.muted} style={{ marginTop: 2 }} />
          <T style={s.small}>
            <T w="semibold" style={[s.small, { color: "#4f4636" }]}>If it’s closed or full: </T>
            {stop.backup.name}{stop.backup.note ? `. ${stop.backup.note}` : ""}
          </T>
        </View>
      ) : null}
    </>
  );
}

/** The whole day as a timeline: enamel numbers on a gilt rail, one card per stop. */
export function Timeline({ tour, current }: { tour: Tour; current?: number }) {
  return (
    <View>
      {tour.stops.map((stop, i) => {
        const last = i === tour.stops.length - 1;
        const here = current === i;
        return (
          <View key={stop.order} style={s.row}>
            <View style={s.rail}>
              <Enamel style={here ? s.here : undefined}>{stop.order}</Enamel>
              {!last ? <LinearGradient colors={["#e3b84a", "#9a7016"]} style={s.railLine} /> : null}
            </View>
            <Card style={[s.stopCard, here && s.stopCardHere]}>
              <View style={s.stopHead}>
                <KindIcon kind={stop.kind} size={16} />
                <StopMeta stop={stop} />
              </View>
              <T w="bold" style={s.stopName}>{stop.name}</T>
              {stop.note ? <T style={s.note}>{stop.note}</T> : null}
              <StopFacts stop={stop} />
              {BADGE_LABEL[stop.badge] || here ? (
                <View style={s.foot}>
                  <BadgeChip badge={stop.badge} />
                  {here ? <T w="bold" style={s.youAre}>You’re here</T> : null}
                </View>
              ) : <View style={{ height: 8 }} />}
            </Card>
          </View>
        );
      })}
    </View>
  );
}

/** Directions, and an optional ride, to one stop. */
export function StopActions({ stop }: { stop: TourStop }) {
  const [ride, setRide] = useState(false);
  const p = place(stop);
  return (
    <View>
      <View style={s.btnRow}>
        <PorcelainButton label="Directions" onPress={() => openDirectionsTo(p)} />
        <PorcelainButton label={ride ? "Ride ▴" : "Ride ▾"} onPress={() => setRide((x) => !x)} />
      </View>
      {ride ? (
        <View style={{ marginTop: 10 }}>
          <View style={s.btnRow}>
            <PorcelainButton label="Uber" onPress={() => openRide("uber", p)} />
            <PorcelainButton label="Lyft" onPress={() => openRide("lyft", p)} />
          </View>
          <T style={[s.small, { marginTop: 6, textAlign: "center" }]}>
            Opens the app with this stop as your drop-off; you confirm the ride and the fare there.
          </T>
        </View>
      ) : null}
    </View>
  );
}

/** The big red enamel "Next stop" button, sized for a thumb on the move. */
export function BigButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.bigShadow, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      <LinearGradient colors={GILT} style={{ borderRadius: 12, padding: 3 }}>
        <LinearGradient colors={ENAMEL} locations={[0, 0.48, 1]} style={s.bigInner}>
          <T w="bold" style={s.bigText}>{label}</T>
          {icon}
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

/** A row of enamel pips: stops done, here, still to come. */
export function Pips({ count, current }: { count: number; current: number }) {
  return (
    <View style={s.pips} accessibilityLabel={`Stop ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[s.pip, i < current && s.pipDone, i === current && s.pipHere]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  sample: { alignSelf: "flex-start", borderWidth: 2, borderColor: C.red, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: "-2deg" }], backgroundColor: "rgba(255,250,240,.7)" },
  sampleText: { color: C.red, fontSize: 12, letterSpacing: 1.5 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: "#b08a2a", paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11.5, color: "#5b3f08", ...letterpress },
  meta: { fontSize: 10.5, letterSpacing: 1.4, color: C.red, flexShrink: 1 },
  line: { flexDirection: "row", gap: 6, marginTop: 6 },
  small: { fontSize: 13, lineHeight: 18, color: C.muted, flex: 1 },
  row: { flexDirection: "row", gap: 10 },
  rail: { width: 26, alignItems: "center", paddingTop: 12 },
  railLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -12, borderRadius: 1 },
  here: { transform: [{ scale: 1.25 }] },
  stopCard: { flex: 1, marginBottom: 12 },
  stopCardHere: { borderWidth: 2, borderColor: C.gold },
  stopHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  stopName: { fontSize: 17, lineHeight: 22, color: "#241d12", marginTop: 4, ...letterpress },
  note: { fontSize: 14, lineHeight: 20, color: "#4f4636", marginTop: 4 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 8 },
  youAre: { fontSize: 12, color: C.red },
  btnRow: { flexDirection: "row", gap: 10 },
  bigShadow: { borderRadius: 12, shadowColor: "#3c280a", shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  bigInner: { borderRadius: 9, paddingVertical: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  bigText: { color: "#fff", fontSize: 22, fontFamily: F.bold, ...engraved, textShadowColor: "rgba(0,0,0,.45)" },
  pips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pip: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: "#c99a2e", backgroundColor: "rgba(255,255,255,.08)" },
  pipDone: { backgroundColor: "#c99a2e" },
  pipHere: { backgroundColor: C.red2, borderColor: C.goldLight, transform: [{ scale: 1.2 }] },
});
