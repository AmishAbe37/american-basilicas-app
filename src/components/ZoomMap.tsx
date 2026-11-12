import { memo, useCallback, useMemo, useState } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import labelsRaw from "../../assets/data/labels.json";
import { BASILICAS, type Basilica } from "../data/basilicas";
import { C, F } from "../theme";
import { OMB } from "./ui";

const BASE = require("../../assets/map/basemap.webp");
const MW = 960, MH = 600;            // website map units
const MAX_K = 10;
type Lab = { t: string; x: number; y: number; rot?: number; lead?: boolean; lake?: boolean; co?: number; dx?: number; anchor?: string };
const L = labelsRaw as { states: Lab[]; physio: Lab[]; water: Lab[]; cities: Lab[] };

type Props = { onOpen: (b: Basilica) => void; visited?: Set<string> };

/** The website's illustrated map, pinch-zoomable. Markers and labels keep their size while the map zooms. */
export default function ZoomMap({ onOpen, visited }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [level, setLevel] = useState(1);                 // coarse zoom level, for what to show
  const k = useSharedValue(1), tx = useSharedValue(0), ty = useSharedValue(0);
  const k0 = useSharedValue(1), tx0 = useSharedValue(0), ty0 = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w === box.w && h === box.h) return;
    setBox({ w, h });
    // open on the lower 48, filling most of the height on a phone held upright
    const bhh = (w * MH) / MW, top0 = Math.max(0, (h - bhh) / 2);
    const k1 = Math.min(2.4, Math.max(1, (h * 0.62) / bhh));
    const fx = (515 / MW) * w, fy = top0 + (285 / MH) * bhh;            // centre of the lower 48
    const lim = (size: number, view: number) => Math.max(0, (size * k1 - view) / 2);
    const cl = (v: number, l: number) => Math.min(l, Math.max(-l, v));
    k.value = k1;
    tx.value = cl((w / 2 - fx) * k1, lim(w, w));
    ty.value = cl((top0 + bhh / 2 - fy) * k1, lim(bhh, h));
    setLevel(k1 >= 5 ? 3 : k1 >= 2.4 ? 2 : 1);
  };

  const bw = box.w, bh = (box.w * MH) / MW;              // map drawn to the full width, centred vertically
  const top = Math.max(0, (box.h - bh) / 2);

  const report = useCallback((kk: number) => setLevel(kk >= 5 ? 3 : kk >= 2.4 ? 2 : 1), []);
  const clamp = (v: number, kk: number, size: number, view: number) => {
    "worklet";
    const lim = Math.max(0, (size * kk - view) / 2);
    return Math.min(lim, Math.max(-lim, v));
  };
  const zoomAt = (kk: number, fx: number, fy: number, base: { k: number; x: number; y: number }) => {
    "worklet";
    const nk = Math.min(MAX_K, Math.max(1, kk));
    const cx = bw / 2, cy = top + bh / 2;               // content centre in view coordinates
    const nx = fx - cx - (fx - cx - base.x) * (nk / base.k);
    const ny = fy - cy - (fy - cy - base.y) * (nk / base.k);
    return { k: nk, x: clamp(nx, nk, bw, box.w), y: clamp(ny, nk, bh, box.h) };
  };

  const pinch = Gesture.Pinch()
    .onStart(() => { k0.value = k.value; tx0.value = tx.value; ty0.value = ty.value; })
    .onUpdate((e) => {
      const r = zoomAt(k0.value * e.scale, e.focalX, e.focalY, { k: k0.value, x: tx0.value, y: ty0.value });
      k.value = r.k; tx.value = r.x; ty.value = r.y;
    })
    .onEnd(() => { runOnJS(report)(k.value); });
  const pan = Gesture.Pan().minDistance(4).averageTouches(true)
    .onStart(() => { tx0.value = tx.value; ty0.value = ty.value; })
    .onUpdate((e) => {
      tx.value = clamp(tx0.value + e.translationX, k.value, bw, box.w);
      ty.value = clamp(ty0.value + e.translationY, k.value, bh, box.h);
    });
  const dbl = Gesture.Tap().numberOfTaps(2).onEnd((e) => {
    const r = zoomAt(k.value * 2.2, e.x, e.y, { k: k.value, x: tx.value, y: ty.value });
    k.value = withTiming(r.k); tx.value = withTiming(r.x); ty.value = withTiming(r.y);
    runOnJS(report)(r.k);
  });
  const gesture = Gesture.Simultaneous(pinch, pan, dbl);

  const step = (f: number) => {
    const r = zoomAt(k.value * f, box.w / 2, box.h / 2, { k: k.value, x: tx.value, y: ty.value });
    k.value = withTiming(r.k); tx.value = withTiming(r.x); ty.value = withTiming(r.y); report(r.k);
  };
  const reset = () => { k.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0); report(1); };

  const content = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: k.value }],
  }));
  const px = (x: number) => (x / MW) * bw, py = (y: number) => (y / MH) * bh;

  const markers = useMemo(() => BASILICAS.slice().sort((a, b) => a.y - b.y), []);
  return (
    <View style={s.wrap} onLayout={onLayout}>
      {bw > 0 && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill} collapsable={false}>
            <Animated.View style={[{ position: "absolute", left: 0, top, width: bw, height: bh }, content]}>
              <Image source={BASE} style={{ width: bw, height: bh }} resizeMode="stretch" />
              {L.water.map((d, i) => (
                <Label key={"w" + i} k={k} x={px(d.x)} y={py(d.y)} rot={d.rot} text={d.t}
                  style={[s.water, d.lake && s.lake]} />
              ))}
              {L.physio.map((d, i) => (
                <Label key={"p" + i} k={k} x={px(d.x)} y={py(d.y)} rot={d.rot} text={d.t.split("").join(" ")} style={s.physio} />
              ))}
              {L.states.map((d, i) => (
                <Label key={"s" + i} k={k} x={px(d.x)} y={py(d.y)} text={d.t} style={[s.state, d.lead && s.lead]} />
              ))}
              {level >= 2 && L.cities.map((d, i) => <City key={"c" + i} k={k} d={d} x={px(d.x)} y={py(d.y)} />)}
              {markers.map((b) => (
                <Marker key={b.id} k={k} b={b} x={px(b.x)} y={py(b.y)} onOpen={onOpen}
                  showName={level >= 3} visited={visited?.has(b.id)} />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>
      )}
      <View style={s.zoom} pointerEvents="box-none">
        <ZBtn label="+" onPress={() => step(1.8)} />
        <ZBtn label={"−"} onPress={() => step(1 / 1.8)} />
        <ZBtn label="Reset" small onPress={reset} />
      </View>
    </View>
  );
}

function useCounter(k: SharedValue<number>) {
  return useAnimatedStyle(() => ({ transform: [{ scale: 1 / k.value }] }));
}

const Label = memo(function Label({ k, x, y, rot = 0, text, style }:
  { k: SharedValue<number>; x: number; y: number; rot?: number; text: string; style: any }) {
  const a = useCounter(k);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x - 100, top: y - 9, width: 200, height: 18, alignItems: "center", justifyContent: "center" }, a]}>
      <Text style={[style, rot ? { transform: [{ rotate: `${rot}deg` }] } : null]} numberOfLines={1}>{text}</Text>
    </Animated.View>
  );
});

const City = memo(function City({ k, d, x, y }: { k: SharedValue<number>; d: Lab; x: number; y: number }) {
  const a = useCounter(k);
  const right = d.anchor === "end";
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x - 80, top: y - 8, width: 160, height: 16, flexDirection: "row", alignItems: "center", justifyContent: right ? "flex-end" : "flex-start", paddingLeft: right ? 0 : 77, paddingRight: right ? 77 : 0 }, a]}>
      {right ? <Text style={s.city}>{d.t} </Text> : null}
      {!d.co && <View style={s.citymark} />}
      {!right ? <Text style={s.city}> {d.t}</Text> : null}
    </Animated.View>
  );
});

const MK_H = 21, MK_W = 14;
const Marker = memo(function Marker({ k, b, x, y, onOpen, showName, visited }:
  { k: SharedValue<number>; b: Basilica; x: number; y: number; onOpen: (b: Basilica) => void; showName: boolean; visited?: boolean }) {
  // canopies are small when the whole country shows, full size once zoomed in
  const a = useAnimatedStyle(() => {
    const f = Math.min(1, 0.6 + 0.16 * (k.value - 1));
    return { transform: [{ translateY: MK_H / 2 }, { scale: f / k.value }, { translateY: -MK_H / 2 }] };
  });
  return (
    <Animated.View style={[{ position: "absolute", left: x - MK_W / 2, top: y - MK_H, width: MK_W, height: MK_H, overflow: "visible" }, a]}>
      <Pressable onPress={() => onOpen(b)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${b.name}, ${b.city}`}>
        <Image source={OMB} style={{ width: MK_W, height: MK_H, opacity: visited === false ? 1 : 1 }} />
      </Pressable>
      {showName && (
        <View pointerEvents="none" style={s.bnameBox}>
          <Text numberOfLines={2} style={s.bname}>{b.name}</Text>
        </View>
      )}
    </Animated.View>
  );
});

function ZBtn({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.zbtn, small && { width: 58 }, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={label === "+" ? "Zoom in" : label === "Reset" ? "Reset zoom" : "Zoom out"}>
      <Text style={[s.zlabel, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

const halo = { textShadowColor: C.paper, textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } };
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.water, overflow: "hidden" },
  state: { fontFamily: F.bold, fontSize: 9, color: "#6c5c39", letterSpacing: 0.2, ...halo },
  lead: { color: "#7a6a45" },
  physio: { fontFamily: F.bold, fontSize: 8, color: "#8a7a55", letterSpacing: 1.6, opacity: 0.9, ...halo },
  water: { fontFamily: F.regular, fontStyle: "italic", fontSize: 7.6, color: "#5f8aa0", ...halo },
  lake: { color: "#4f7f96", fontFamily: F.semibold },
  city: { fontFamily: F.semibold, fontSize: 8, color: "#3a3226", ...halo },
  citymark: { width: 4, height: 4, backgroundColor: "#fff", borderWidth: 0.9, borderColor: "#3a3226" },
  bnameBox: { position: "absolute", left: MK_W + 1, top: 1, width: 118 },
  bname: { fontFamily: F.semibold, fontSize: 8.5, lineHeight: 10, color: C.text, ...halo },
  zoom: { position: "absolute", right: 10, bottom: 12, gap: 6, alignItems: "flex-end" },
  zbtn: { width: 40, height: 36, borderRadius: 8, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.gold },
  zlabel: { color: C.gold, fontFamily: F.bold, fontSize: 20 },
});
