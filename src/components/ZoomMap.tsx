import { memo, useCallback, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import labelsRaw from "../../assets/data/labels.json";
import { BASILICAS, type Basilica } from "../data/basilicas";
import { C, F } from "../theme";
import { OMB } from "./ui";

const BASE = require("../../assets/map/basemap.webp");
const MW = 960, MH = 600;            // website map units
const MAX_K = 10;
const LOWER48 = { x0: 48, y0: 30, x1: 912, y1: 568 };   // the lower 48 on the site's map, in map units
const EASE = { duration: 520, easing: Easing.inOut(Easing.cubic) };
type Lab = { t: string; x: number; y: number; rot?: number; lead?: boolean; lake?: boolean; co?: number; dx?: number; anchor?: string };
const L = labelsRaw as { states: Lab[]; physio: Lab[]; water: Lab[]; cities: Lab[] };

export type ZoomMapHandle = {
  /** Zoom and pan smoothly so these basilicas fill the map. */
  fitTo: (list: Basilica[]) => void;
  /** Back to the opening view of the lower 48. */
  home: () => void;
};
type Props = {
  onMarker: (b: Basilica) => void;
  visited?: Set<string>;
  /** The basilica picked in the list or on the map: its canopy is drawn on a gold halo. */
  selectedId?: string | null;
  /** The state opened in the list: its basilicas are named as soon as the map is zoomed in a little. */
  focusState?: string | null;
  ref?: Ref<ZoomMapHandle>;
};
type View3 = { k: number; x: number; y: number };

/** The website's illustrated map, pinch-zoomable. Markers and labels keep their size while the map zooms. */
export default function ZoomMap({ onMarker, visited, selectedId, focusState, ref }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [level, setLevel] = useState(1);                 // coarse zoom level, for what to show
  const k = useSharedValue(1), tx = useSharedValue(0), ty = useSharedValue(0);
  const k0 = useSharedValue(1), tx0 = useSharedValue(0), ty0 = useSharedValue(0);

  // The map is drawn to the full width and centred vertically; in a short box it runs past the top and bottom.
  const bw = box.w, bh = (box.w * MH) / MW;
  const top = (box.h - bh) / 2;
  const levelOf = (kk: number) => (kk >= 5 ? 3 : kk >= 2.4 ? 2 : 1);
  const report = useCallback((kk: number) => setLevel(levelOf(kk)), []);

  const clamp = (v: number, kk: number, size: number, view: number) => {
    "worklet";
    const lim = Math.max(0, (size * kk - view) / 2);
    return Math.min(lim, Math.max(-lim, v));
  };
  /** The view that fits a box of map units, keeping `pad` points clear and room above for the canopies. */
  const fitView = useCallback((x0: number, y0: number, x1: number, y1: number, W: number, H: number, pad: number, mk: number, kmax: number): View3 => {
    const cw = W, ch = (W * MH) / MW, sc = cw / MW;
    const sx = Math.max(1, (x1 - x0) * sc), sy = Math.max(1, (y1 - y0) * sc);
    const kk = Math.min(kmax, Math.max(1, Math.min((W - 2 * pad) / sx, (H - 2 * pad - mk) / sy)));
    const cx = ((x0 + x1) / 2) * sc, cy = ((y0 + y1) / 2) * sc;
    return { k: kk, x: clamp(-(cx - cw / 2) * kk, kk, cw, W), y: clamp(-(cy - ch / 2) * kk + mk / 2, kk, ch, H) };
  }, []);
  const homeView = useCallback((W: number, H: number) =>
    fitView(LOWER48.x0, LOWER48.y0, LOWER48.x1, LOWER48.y1, W, H, 2, 0, 3), [fitView]);

  const go = useCallback((v: View3, animate = true) => {
    if (animate) { k.value = withTiming(v.k, EASE); tx.value = withTiming(v.x, EASE); ty.value = withTiming(v.y, EASE); }
    else { k.value = v.k; tx.value = v.x; ty.value = v.y; }
    report(v.k);
  }, [k, tx, ty, report]);

  const boxRef = useRef(box); boxRef.current = box;
  useImperativeHandle(ref, () => ({
    fitTo: (list) => {
      const { w, h } = boxRef.current;
      if (!w || !list.length) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const b of list) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x); y1 = Math.max(y1, b.y); }
      // a lone basilica, or a tight cluster, still shows its surroundings
      const minSpan = 110;
      if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
      if (y1 - y0 < minSpan * 0.6) { const c = (y0 + y1) / 2; y0 = c - minSpan * 0.3; y1 = c + minSpan * 0.3; }
      go(fitView(x0, y0, x1, y1, w, h, 34, MK_H, 4.6));   // below the level where every name shows
    },
    home: () => { const { w, h } = boxRef.current; if (w) go(homeView(w, h)); },
  }), [go, fitView, homeView]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w === box.w && h === box.h) return;
    setBox({ w, h });
    go(homeView(w, h), false);                           // open on the lower 48
  };

  const zoomAt = (kk: number, fx: number, fy: number, base: View3) => {
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
  const reset = () => go(homeView(box.w, box.h));

  const content = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: k.value }],
  }));
  const px = (x: number) => (x / MW) * bw, py = (y: number) => (y / MH) * bh;

  // drawn north to south so nearer canopies overlap farther ones; the picked one on top of all
  const markers = useMemo(() => {
    const m = BASILICAS.slice().sort((a, b) => a.y - b.y);
    const i = m.findIndex((b) => b.id === selectedId);
    if (i >= 0) m.push(m.splice(i, 1)[0]);
    return m;
  }, [selectedId]);
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
                <Label key={"p" + i} k={k} x={px(d.x)} y={py(d.y)} rot={d.rot} text={d.t.split("").join(" ")} style={s.physio} />
              ))}
              {L.states.map((d, i) => (
                <Label key={"s" + i} k={k} x={px(d.x)} y={py(d.y)} text={d.t} style={[s.state, d.lead && s.lead]} />
              ))}
              {level >= 2 && L.cities.map((d, i) => <City key={"c" + i} k={k} d={d} x={px(d.x)} y={py(d.y)} />)}
              {markers.map((b) => (
                <Marker key={b.id} k={k} b={b} x={px(b.x)} y={py(b.y)} onPress={onMarker} picked={b.id === selectedId}
                  showName={level >= 3 || b.id === selectedId || (level >= 2 && b.state === focusState)} visited={visited ? visited.has(b.id) : undefined} />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>
      )}
      <View style={s.zoom} pointerEvents="box-none">
        <ZBtn label={"−"} onPress={() => step(1 / 1.8)} />
        <ZBtn label="+" onPress={() => step(1.8)} />
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
const Marker = memo(function Marker({ k, b, x, y, onPress, showName, visited, picked }:
  { k: SharedValue<number>; b: Basilica; x: number; y: number; onPress: (b: Basilica) => void; showName: boolean; visited?: boolean; picked?: boolean }) {
  // canopies are small when the whole country shows, full size once zoomed in
  const a = useAnimatedStyle(() => {
    const f = Math.min(1, 0.6 + 0.16 * (k.value - 1)) * (picked ? 1.3 : 1);
    return { transform: [{ translateY: MK_H / 2 }, { scale: f / k.value }, { translateY: -MK_H / 2 }] };
  });
  return (
    <Animated.View style={[{ position: "absolute", left: x - MK_W / 2, top: y - MK_H, width: MK_W, height: MK_H, overflow: "visible" }, a]}>
      {picked && <View pointerEvents="none" style={s.halo} />}
      <Pressable onPress={() => onPress(b)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${b.name}, ${b.city}`}
        accessibilityHint="Shows it in the list below">
        <Image source={OMB} style={{ width: MK_W, height: MK_H, opacity: visited === false ? 0.38 : 1 }} />
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
  halo: { position: "absolute", left: -6, top: 3, width: MK_W + 12, height: MK_W + 12, borderRadius: MK_W, backgroundColor: "rgba(217,165,33,.55)", borderWidth: 1.5, borderColor: C.gold },
  bnameBox: { position: "absolute", left: MK_W + 1, top: 1, width: 118 },
  bname: { fontFamily: F.semibold, fontSize: 8.5, lineHeight: 10, color: C.text, ...halo },
  // a row along the top right, over Canada, where no basilica is marked
  zoom: { position: "absolute", right: 8, top: 8, gap: 6, flexDirection: "row" },
  zbtn: { width: 38, height: 32, borderRadius: 8, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.gold },
  zlabel: { color: C.gold, fontFamily: F.bold, fontSize: 20 },
});
