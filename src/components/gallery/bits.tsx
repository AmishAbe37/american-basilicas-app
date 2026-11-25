import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { countLine, countTotal, isOnline, MANAGED_ON_SITE, memberLine, type Counts, type LikeKind, type Line, type Membership, type Status } from "../../lib/gallery";
import { C, F } from "../../theme";
import { ENAMEL, GILT, T, letterpress } from "../ui";

/** A line of the website's wording, with its bold parts. */
export function Rich({ line, style }: { line: Line["parts"]; style?: any }) {
  return <T style={[s.text, style]}>{line.map((p, i) => (p.b ? <T key={i} w="bold" style={[s.text, style]}>{p.t}</T> : p.t))}</T>;
}

/** The status note at the top of the gallery (the site's .gnote): a chip and where the member stands. */
export function MemberNote({ M, offlineSince }: { M: Membership; offlineSince?: string | null }) {
  const line = memberLine(M);
  return (
    <View style={[s.note, M.kind === "expired" && s.noteExpired]}>
      <View style={s.noteRow}>
        <View style={[s.tag, M.kind === "expired" ? s.tagExpired : null]}><T w="black" style={s.tagText}>{line.tag}</T></View>
      </View>
      <Rich line={line.parts} style={{ fontSize: 13.5, lineHeight: 19 }} />
      {M.kind !== "admin" ? <T style={[s.hint, { marginTop: 4 }]}>{MANAGED_ON_SITE}</T> : null}
      {offlineSince ? <Offline since={offlineSince} /> : null}
    </View>
  );
}

export function Offline({ since, style }: { since: string; style?: any }) {
  const d = new Date(since);
  return (
    <T style={[s.offline, style]}>
      No signal: showing what you last loaded{isNaN(d.getTime()) ? "" : ` (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })})`}.
    </T>
  );
}

/** For members without gallery access (the site's .paywall), with no purchase button or link in the app. */
export function NoAccess({ M, name, counts, onRecheck }: { M: Membership; name: string; counts?: Partial<Counts>; onRecheck: () => Promise<Membership | null> }) {
  const [label, setLabel] = useState("Check again");
  const [busy, setBusy] = useState(false);
  const c = counts || {};
  async function recheck() {
    setBusy(true); setLabel("Checking…");
    try {
      const m = await onRecheck();
      if (m?.access) return;
      setLabel("Not found yet — try again in a minute");
    } catch (e: any) { setLabel(`Couldn’t check: ${e?.message || e}`); }
    setTimeout(() => { setBusy(false); setLabel("Check again"); }, 4000);
  }
  return (
    <View style={s.paywall}>
      <T style={[s.text, { fontSize: 15 }]}>
        {countTotal(c) ? <><T w="bold" style={[s.text, { fontSize: 15 }]}>{countLine(c)}</T> about {name} are waiting in the members’ gallery.</>
          : <>No one has shared photos, reviews or questions about {name} yet.</>}
      </T>
      <Rich line={memberLine(M).parts} style={{ marginTop: 8 }} />
      <T style={[s.hint, { marginTop: 8 }]}>{MANAGED_ON_SITE} If you’ve become a subscriber with the same email you sign in with{M.email ? ` (${M.email})` : ""}, it can take a minute to show up here.</T>
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <SmallButton label={label} onPress={recheck} disabled={busy} />
      </View>
    </View>
  );
}

const STATUS: Record<Status, [string, string]> = {
  pending: ["Awaiting review", "#8a6514"], approved: ["In members’ gallery", "#2f6b3a"], rejected: ["Only in your visit", C.red],
};
const QA_STATUS: Partial<Record<Status, [string, string]>> = { pending: ["Waiting for approval", "#8a6514"], rejected: ["Not shared", C.red] };
/** Moderation chips in the website's words: reviews use visit.js's, questions and answers use bview.js's. */
export function StatusChip({ status, qa }: { status: Status; qa?: boolean }) {
  const v = qa ? QA_STATUS[status] : STATUS[status] || STATUS.pending;
  if (!v) return null;
  return <View style={[s.chip, { borderColor: v[1] }]}><T w="bold" style={[s.chipText, { color: v[1] }]}>{v[0]}</T></View>;
}

/** Heart and count. Optimistic: flips at once, flips back if the server says no. Likes need a connection. */
export function LikeButton({ kind, count, liked, own, onToggle, onMessage }: {
  kind: LikeKind; count: number; liked: boolean; own: boolean;
  onToggle: (on: boolean) => Promise<void>; onMessage: (t: string) => void;
}) {
  const [state, setState] = useState({ liked, count });
  const [busy, setBusy] = useState(false);
  // follow changes made elsewhere (e.g. in the full-screen viewer)
  const [seen, setSeen] = useState({ liked, count });
  if (seen.liked !== liked || seen.count !== count) { setSeen({ liked, count }); setState({ liked, count }); }
  async function press() {
    if (busy || own) return;
    if (!(await isOnline())) { onMessage("You’re offline. Likes need a connection — please try again when you have signal."); return; }
    const on = !state.liked;
    setBusy(true); setState({ liked: on, count: state.count + (on ? 1 : -1) });
    try { await onToggle(on); }
    catch (e: any) { setState({ liked: !on, count: state.count }); onMessage(`Couldn’t save your like: ${e?.message || e}`); }
    setBusy(false);
  }
  const label = own ? `Likes on your ${kind}: ${state.count}` : `${state.liked ? "Unlike" : "Like"} this ${kind}: ${state.count}`;
  return (
    <Pressable onPress={press} disabled={own} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: state.liked, disabled: own }}
      hitSlop={8} style={({ pressed }) => [s.like, state.liked && s.likeOn, own && { opacity: 0.6 }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={state.liked ? "heart" : "heart-outline"} size={15} color={state.liked ? "#fff" : C.red} />
      <T w="bold" style={[s.likeN, state.liked && { color: "#fff" }]}>{state.count}</T>
    </Pressable>
  );
}

/** Porcelain and enamel buttons sized for a card row. */
export function SmallButton({ label, onPress, disabled, solid, danger, style }: {
  label: string; onPress: () => void; disabled?: boolean; solid?: boolean; danger?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btnShadow, style, (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85 }]}>
      {solid ? (
        <LinearGradient colors={GILT} style={{ borderRadius: 8, padding: 1.5 }}>
          <LinearGradient colors={ENAMEL} locations={[0, 0.48, 1]} style={s.smallInner}>
            <T w="bold" style={s.smallSolid}>{label}</T>
          </LinearGradient>
        </LinearGradient>
      ) : (
        <LinearGradient colors={["#fffef9", "#f3ead6"]} style={[s.smallPorcelain, danger && { borderColor: "#c98f8f" }]}>
          <T w="semibold" style={[s.smallText, danger && { color: C.red }]}>{label}</T>
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function Link({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return <T w="semibold" style={s.link} onPress={onPress} accessibilityRole="link">{children}</T>;
}

export function Box(props: TextInputProps) {
  return <TextInput placeholderTextColor="#8a7d63" multiline {...props} style={[s.box, props.style]} />;
}

export function Msg({ text, kind }: { text: string | null; kind?: "ok" | "err" | "" }) {
  if (!text) return null;
  return <T style={[s.msg, kind === "ok" && { color: "#2f6b3a" }, kind === "err" && { color: C.red }]} accessibilityLiveRegion="polite">{text}</T>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <View style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 10 }}><ActivityIndicator color={C.red} /><T style={s.hint}>{label}</T></View>;
}

/** Segmented control: the site's tabs (with counts) and its "Sort" buttons. */
export function Segments<K extends string>({ items, value, onChange, small, label }: {
  items: { k: K; label: string; n?: number }[]; value: K; onChange: (k: K) => void; small?: boolean; label?: string;
}) {
  return (
    <View style={[s.seg, small && s.segSmall]} accessibilityRole="tablist">
      {label ? <T w="black" style={s.segLabel}>{label}</T> : null}
      {items.map((it) => {
        const on = it.k === value;
        return (
          <Pressable key={it.k} onPress={() => onChange(it.k)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={[small ? s.segItemSmall : s.segItem, on && s.segOn]}>
            <T w={on ? "bold" : "semibold"} style={[s.segText, small && { fontSize: 13 }, on && { color: "#fff" }]}>
              {it.label}{it.n != null ? <T w="black" style={[s.segN, on && { color: C.goldLight }]}>  {it.n}</T> : null}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export const gs = StyleSheet.create({
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636" },
  hint: { fontSize: 12.5, lineHeight: 18, color: C.muted },
  h: { fontSize: 15, color: "#241d12", ...letterpress },
});

const s = StyleSheet.create({
  text: gs.text,
  hint: gs.hint,
  note: { backgroundColor: "#fbf3dc", borderWidth: 1, borderColor: "#d9bf72", borderRadius: 9, padding: 11, gap: 6 },
  noteExpired: { backgroundColor: "#f8ebe6", borderColor: "#d7a79c" },
  noteRow: { flexDirection: "row" },
  tag: { backgroundColor: "#2f6b3a", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  tagExpired: { backgroundColor: C.red },
  tagText: { color: "#fff", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  offline: { fontSize: 12.5, lineHeight: 18, color: "#8a6514" },
  paywall: { backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#d3c3a0", borderStyle: "dashed", borderRadius: 9, padding: 14 },
  chip: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, backgroundColor: "#fffdf8" },
  chipText: { fontSize: 11, letterSpacing: 0.3 },
  like: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#c9a7a0", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: "#fffdf8" },
  likeOn: { backgroundColor: C.red, borderColor: "#6e1111" },
  likeN: { fontSize: 13, color: C.red },
  btnShadow: { borderRadius: 8, shadowColor: "#3c280a", shadowOpacity: 0.22, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  smallInner: { borderRadius: 6.5, paddingVertical: 8, paddingHorizontal: 14, alignItems: "center" },
  smallSolid: { color: "#fff", fontSize: 14.5, textShadowColor: "rgba(0,0,0,.45)", textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
  smallPorcelain: { borderRadius: 8, borderWidth: 1, borderColor: "#c9b98f", paddingVertical: 8, paddingHorizontal: 14, alignItems: "center" },
  smallText: { color: "#7a1f1f", fontSize: 14 },
  link: { color: "#7a1f1f", fontSize: 14, textDecorationLine: "underline" },
  box: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 8, padding: 10, minHeight: 84, textAlignVertical: "top" },
  msg: { fontSize: 13.5, lineHeight: 19, color: C.muted, marginTop: 6 },
  seg: { flexDirection: "row", borderWidth: 1, borderColor: "#b9a678", borderRadius: 9, overflow: "hidden", backgroundColor: "#fbf8f0" },
  segSmall: { alignSelf: "flex-start", alignItems: "center", borderWidth: 0, backgroundColor: "transparent", gap: 6 },
  segLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginRight: 2 },
  segItem: { flex: 1, paddingVertical: 9, alignItems: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#b9a678" },
  segItemSmall: { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: "#c9b98f", borderRadius: 14, backgroundColor: "#fffdf8" },
  segOn: { backgroundColor: C.red, borderColor: "#6e1111" },
  segText: { fontSize: 14.5, color: "#4a4030" },
  segN: { fontSize: 12, color: C.red },
});
