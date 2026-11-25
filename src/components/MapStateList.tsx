import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useImperativeHandle, useRef, type Ref } from "react";
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { BY_STATE, type Basilica } from "../data/basilicas";
import type { Picked } from "../lib/usePicked";
import { C } from "../theme";
import { Card, Enamel, Paper, T, letterpress } from "./ui";

export type MapStateListHandle = {
  scrollToState: (state: string) => void;
  scrollToBasilica: (b: Basilica) => void;
};
type Props = {
  picked: Picked;
  onState: (state: string, list: Basilica[]) => void;
  onOpen: (b: Basilica) => void;
  visited?: Set<string>;
  ref?: Ref<MapStateListHandle>;
};

/** The state-by-state index under the map: one card per state; the open card lists its basilicas. */
export default function MapStateList({ picked, onState, onOpen, visited, ref }: Props) {
  const sv = useRef<ScrollView>(null);
  const viewH = useRef(0);
  const cardY = useRef(new Map<string, number>());
  const bodyY = useRef(new Map<string, number>());
  const rowY = useRef(new Map<string, { y: number; h: number }>());

  // Wait a frame or two for the opened card to lay out, then scroll.
  const later = (fn: () => void) => setTimeout(fn, 90);
  useImperativeHandle(ref, () => ({
    scrollToState: (state) => later(() => {
      const y = cardY.current.get(state);
      if (y != null) sv.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
    }),
    scrollToBasilica: (b) => later(() => {
      const cy = cardY.current.get(b.state), by = bodyY.current.get(b.state), r = rowY.current.get(b.id);
      if (cy == null) return;
      let y = cy - 10;                                     // the state's heading at the top, if the row fits below it
      if (by != null && r) {
        const rowTop = cy + by + r.y;
        if (rowTop + r.h > y + viewH.current - 12) y = rowTop - viewH.current / 2 + r.h / 2;
      }
      sv.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }),
  }));

  return (
    <Paper>
      <ScrollView ref={sv} onLayout={(e) => { viewH.current = e.nativeEvent.layout.height; }}
        contentContainerStyle={{ padding: 14, paddingTop: 14, paddingBottom: 30 }}>
        {BY_STATE.map(({ state, data }) => (
          <View key={state} onLayout={(e) => { cardY.current.set(state, e.nativeEvent.layout.y); }}>
            <StateCard state={state} list={data} open={picked.state === state} pickedId={picked.state === state ? picked.id : null}
              visited={visited} onHead={onState} onOpen={onOpen}
              onBody={(e) => bodyY.current.set(state, e.nativeEvent.layout.y)}
              onRow={(id, e) => rowY.current.set(id, { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })} />
          </View>
        ))}
      </ScrollView>
    </Paper>
  );
}

type CardProps = {
  state: string; list: Basilica[]; open: boolean; pickedId: string | null; visited?: Set<string>;
  onHead: (state: string, list: Basilica[]) => void; onOpen: (b: Basilica) => void;
  onBody: (e: LayoutChangeEvent) => void; onRow: (id: string, e: LayoutChangeEvent) => void;
};

const StateCard = memo(function StateCard({ state, list, open, pickedId, visited, onHead, onOpen, onBody, onRow }: CardProps) {
  const seen = visited ? list.filter((b) => visited.has(b.id)).length : 0;
  return (
    <Card style={{ marginBottom: 12 }}>
      <Pressable onPress={() => onHead(state, list)} accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={`${state}, ${list.length} ${list.length === 1 ? "basilica" : "basilicas"}`}
        accessibilityHint={open ? "Folds the list and shows the whole country" : "Shows them on the map"}
        style={({ pressed }) => [s.h3, open && s.h3open, pressed && s.pressed]}>
        <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={15} color={C.red} style={{ marginRight: 4 }} />
        <T w="black" style={s.stname}>{state}</T>
        {seen ? <T w="semibold" style={s.seen}>{seen} visited</T> : null}
        <Enamel>{list.length}</Enamel>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(220)} onLayout={onBody}>
          {list.map((b, i) => {
            const hot = b.id === pickedId, been = visited?.has(b.id);
            return (
              <Pressable key={b.id} onPress={() => onOpen(b)} onLayout={(e) => onRow(b.id, e)}
                style={({ pressed }) => [s.li, i < list.length - 1 && s.dotted, hot && s.hot, pressed && s.pressed]}
                accessibilityRole="button" accessibilityLabel={`${b.name}, ${b.city}${been ? ", visited" : ""}`}
                accessibilityHint="Opens its photo and facts">
                <T w="bold" style={s.city}>{b.city}</T>
                <T style={s.bname}>{b.name}</T>
                {been ? <Ionicons name="checkmark-circle" size={16} color={C.red} accessibilityElementsHidden /> : null}
                <Ionicons name="chevron-forward" size={14} color="#a8986f" />
              </Pressable>
            );
          })}
        </Animated.View>
      ) : (
        <T style={s.cities} numberOfLines={1}>{[...new Set(list.map((b) => b.city))].join(" · ")}</T>
      )}
    </Card>
  );
});

const s = StyleSheet.create({
  h3: { flexDirection: "row", alignItems: "center", paddingBottom: 5, marginBottom: 2, marginHorizontal: -6, paddingHorizontal: 6, paddingTop: 2, borderBottomWidth: 1.5, borderBottomColor: C.rule, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  h3open: { backgroundColor: "#fbf1d8" },
  stname: { flex: 1, fontSize: 16, color: "#241d12", letterSpacing: 0.2, ...letterpress },
  seen: { fontSize: 12, color: C.muted, marginRight: 8 },
  cities: { fontSize: 13, color: C.muted, paddingTop: 3, paddingBottom: 6 },
  li: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "center", marginHorizontal: -6, paddingHorizontal: 6 },
  dotted: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  hot: { backgroundColor: "rgba(217,165,33,.28)", borderRadius: 4 },
  pressed: { backgroundColor: "rgba(217,165,33,.18)" },
  city: { width: "30%", fontSize: 14, color: "#4a4030" },
  bname: { flex: 1, fontSize: 14.5, lineHeight: 19, color: "#2a2318" },
});
