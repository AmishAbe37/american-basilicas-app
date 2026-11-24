import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import { BigButton, KindIcon, Pips, SampleStamp, StopActions, StopFacts, StopMeta, Timeline, BadgeChip } from "../../src/components/TourParts";
import { Card, Cosmati, EnamelButton, GiltFrame, Kicker, Lacquer, Lead, Paper, T, Valance, letterpress } from "../../src/components/ui";
import VisitPanel from "../../src/components/VisitPanel";
import { byId } from "../../src/data/basilicas";
import { PHOTO_RATIO, PHOTOS } from "../../src/data/photos";
import { clock, lengthLabel, tourById, type Tour } from "../../src/data/tours";
import { SHOP_URL, openWeb } from "../../src/lib/open";
import { useTourProgress } from "../../src/lib/tourProgress";
import { C } from "../../src/theme";

const fmtDate = (d?: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

/** A day tour: the plan (intro and timeline), "Start tour" mode one stop at a time, and the end of the day. */
export default function TourScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = tourById(String(id));
  const { width } = useWindowDimensions();
  const colW = Math.min(width, 640) - 28;
  const P = useTourProgress(String(id), t?.stops.length ?? 0);
  const [view, setView] = useState<"plan" | "go" | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  // open where the visitor left off: in the middle of a tour, straight to the current stop
  useEffect(() => { if (P.ready && view === null) setView(P.progress && !P.progress.finished ? "go" : "plan"); }, [P.ready, P.progress, view]);
  const at = P.progress ? `${P.progress.current}:${P.progress.finished}` : "";
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [view, at]);

  if (!t) return <Paper><T style={{ padding: 20 }}>This tour isn’t in the app yet.</T></Paper>;
  const p = P.progress;
  const going = view === "go" && p && !p.finished;
  const tap = () => { if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {}); };

  return (
    <Paper>
      <Stack.Screen options={{ title: going ? "On tour" : t.city, headerBackTitle: "Back", headerBackground: () => <Lacquer style={{ flex: 1 }} /> }} />
      <Valance style={{ marginBottom: -10 }} />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 26, paddingBottom: 48, alignItems: "center" }}>
        <View style={{ width: colW }}>
          {going ? (
            <Go t={t} current={p.current}
              next={() => { tap(); if (p.current >= t.stops.length - 1) { P.finish(); setView("plan"); } else P.go(p.current + 1); }}
              back={() => P.go(p.current - 1)}
              plan={() => setView("plan")}
              end={() => { P.reset(); setView("plan"); }} />
          ) : (
            <Plan t={t} colW={colW} progress={p}
              start={() => { tap(); if (!p || p.finished) P.start(); setView("go"); }}
              again={() => { P.reset(); }} />
          )}
        </View>
      </ScrollView>
    </Paper>
  );
}

function Plan({ t, colW, progress, start, again }: {
  t: Tour; colW: number; progress: ReturnType<typeof useTourProgress>["progress"]; start: () => void; again: () => void;
}) {
  const first = t.basilica_ids[0];
  const photo = PHOTOS[first];
  const imgW = colW - 2 * 7 - 2;
  const ratio = Math.min(PHOTO_RATIO[first] || 0.66, 0.62);
  const finished = progress?.finished;
  return (
    <>
      {finished ? <Remember t={t} again={again} /> : null}

      {photo ? (
        <GiltFrame>
          <Image source={photo} style={{ width: imgW, height: imgW * ratio }} resizeMode="cover" accessibilityLabel={`Photo of ${byId(first)?.name ?? "the basilica"}`} />
        </GiltFrame>
      ) : null}

      {t.sample ? <SampleStamp style={{ marginTop: 16 }} /> : null}
      <Kicker style={{ marginTop: 16, color: C.red }}>Day tour  ·  {t.city}, {t.state}</Kicker>
      <T w="bold" style={s.title}>{t.title}</T>

      <View style={{ marginTop: 12 }}><Lead>{t.intro}</Lead></View>

      <Card style={{ marginTop: 16 }}>
        <Fact icon="calendar-outline" label="Best days" value={t.best_days} />
        <Fact icon="time-outline" label="Basilica hours" value={t.best_hours} />
        <Fact icon="hourglass-outline" label="Length" value={`${lengthLabel(t.length_hours)}, ${t.stops.length} stops`} />
        {t.basilica_ids.length > 1 ? (
          <Fact icon="business-outline" label="Basilicas" value={t.basilica_ids.map((b) => byId(b)?.name).filter(Boolean).join("; ")} />
        ) : null}
      </Card>

      <View style={{ marginTop: 18 }}>
        {!finished ? (
          <EnamelButton label={progress ? `Carry on: stop ${progress.current + 1} of ${t.stops.length}` : "Start tour"} onPress={start}
            icon={<Ionicons name={progress ? "play-forward" : "play"} size={16} color="#fff" />} />
        ) : null}
        <T style={s.hint}>One stop at a time, with directions and a ride to each. It works without signal; your place is saved on this phone.</T>
      </View>

      <Cosmati style={{ marginTop: 20, marginBottom: 18 }} />

      <Kicker style={{ marginBottom: 12 }}>The day, stop by stop</Kicker>
      <Timeline tour={t} current={progress && !finished ? progress.current : undefined} />

      <T style={s.hint}>
        Hours and menus change, so check before you set out{t.checked_on ? `. These were last checked ${fmtDate(t.checked_on)}` : ""}.
      </T>
    </>
  );
}

function Fact({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={s.fact}>
      <Ionicons name={icon} size={16} color={C.red} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Kicker style={{ fontSize: 10.5, letterSpacing: 1.4 }}>{label}</Kicker>
        <T style={s.factText}>{value}</T>
      </View>
    </View>
  );
}

/** "Start tour" mode: the current stop, big and simple, with a big "Next stop" button. */
function Go({ t, current, next, back, plan, end }: { t: Tour; current: number; next: () => void; back: () => void; plan: () => void; end: () => void }) {
  const stop = t.stops[current];
  const after = t.stops[current + 1];
  const last = !after;
  const bid = stop.kind === "basilica" ? stop.basilica_id ?? (t.basilica_ids.length === 1 ? t.basilica_ids[0] : undefined) : undefined;
  return (
    <>
      <Lacquer style={s.band}>
        <View style={{ flex: 1, gap: 8 }}>
          <T w="black" style={s.bandKicker}>{t.sample ? "SAMPLE  ·  " : ""}Stop {current + 1} of {t.stops.length}</T>
          <Pips count={t.stops.length} current={current} />
        </View>
        <Pressable onPress={plan} accessibilityRole="button" hitSlop={8}>
          <T w="semibold" style={s.bandLink}>Whole day</T>
        </Pressable>
      </Lacquer>

      <GiltFrame style={{ marginTop: 16 }}>
        <Paper style={{ flexGrow: 0, flexShrink: 0, flexBasis: "auto", padding: 14 }} color="#fbf8f0">
          <View style={s.stopHead}>
            <KindIcon kind={stop.kind} size={20} />
            <StopMeta stop={stop} />
          </View>
          <T w="bold" style={s.goName}>{stop.name}</T>
          <T style={s.addr}>{stop.address}</T>
          {stop.note ? <T style={s.goNote}>{stop.note}</T> : null}
          <StopFacts stop={stop} />
          <View style={{ marginTop: 10 }}><BadgeChip badge={stop.badge} /></View>
          <View style={{ marginTop: 14 }}><StopActions stop={stop} /></View>
          {bid ? (
            <Pressable onPress={() => router.push(`/basilica/${bid}`)} style={{ paddingTop: 12 }} accessibilityRole="link">
              <T w="semibold" style={s.link}>About this basilica, and log your visit ›</T>
            </Pressable>
          ) : null}
        </Paper>
      </GiltFrame>

      <View style={{ marginTop: 22 }}>
        <BigButton label={last ? "Finish the tour" : "Next stop"} onPress={next}
          icon={<Ionicons name={last ? "checkmark" : "arrow-forward"} size={22} color="#fff" />} />
        {after ? (
          <T style={s.upNext}>
            Up next: <T w="semibold" style={[s.upNext, { color: C.text }]}>{after.name}</T>{after.time ? `, about ${clock(after.time)}` : ""}
          </T>
        ) : <T style={s.upNext}>This is the last stop of the day.</T>}
      </View>

      <Cosmati style={{ marginTop: 22, marginBottom: 10 }} />
      <View style={s.footRow}>
        {current > 0 ? (
          <Pressable onPress={back} accessibilityRole="button" hitSlop={8}><T w="semibold" style={s.link}>‹ Previous stop</T></Pressable>
        ) : <View />}
        <Pressable onPress={end} accessibilityRole="button" hitSlop={8}><T w="semibold" style={[s.link, { color: C.muted }]}>End tour</T></Pressable>
      </View>
    </>
  );
}

/** The end of the day: log the visit, then (quietly) the shop. */
function Remember({ t, again }: { t: Tour; again: () => void }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Card>
        <Kicker style={{ color: C.red }}>Remember the trip</Kicker>
        <T style={s.remember}>
          Well done, pilgrim. Add the date, a private note and your photos while the day is fresh. Your photos can be shared in the members’ gallery once they’re approved.
        </T>
      </Card>
      {t.basilica_ids.map((bid) => {
        const b = byId(bid);
        if (!b) return null;
        return (
          <View key={bid}>
            {t.basilica_ids.length > 1 ? <T w="bold" style={s.bName}>{b.name}</T> : null}
            <VisitPanel b={b} />
          </View>
        );
      })}
      <View style={s.footRow}>
        <T style={[s.hint, { marginTop: 14, flex: 1 }]}>
          Keepsakes of the day, like prints and cards, are in the{" "}
          <T style={[s.hint, s.link]} onPress={() => openWeb(SHOP_URL)}>shop ↗</T>
        </T>
      </View>
      <Pressable onPress={again} accessibilityRole="button" style={{ paddingTop: 10 }}>
        <T w="semibold" style={s.link}>Take this tour again</T>
      </Pressable>
      <Cosmati style={{ marginTop: 18 }} />
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 25, lineHeight: 30, color: "#241d12", marginTop: 4, ...letterpress },
  hint: { fontSize: 13, lineHeight: 19, color: C.muted, marginTop: 10, textAlign: "center" },
  fact: { flexDirection: "row", gap: 10, paddingBottom: 9, marginBottom: 2 },
  factText: { fontSize: 15, lineHeight: 21, color: "#2a2318", marginTop: 1 },
  band: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 12 },
  bandKicker: { color: "#e3b84a", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  bandLink: { color: C.goldLight, fontSize: 14, textDecorationLine: "underline" },
  stopHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  goName: { fontSize: 26, lineHeight: 31, color: "#241d12", marginTop: 6, ...letterpress },
  addr: { fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 2 },
  goNote: { fontSize: 16, lineHeight: 23, color: "#2a2318", marginTop: 10 },
  link: { color: "#7a1f1f", fontSize: 14.5 },
  upNext: { fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 10, textAlign: "center" },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  remember: { fontSize: 15, lineHeight: 22, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  bName: { fontSize: 15, color: "#241d12", marginTop: 18, marginBottom: -12 },
});
